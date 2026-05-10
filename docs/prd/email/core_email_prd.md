# 邮件模块 Backend PRD — 用户邮箱连接 · SMTP/IMAP/POP3 收发

> 版本：v1.0 | 日期：2026-05-10
> 状态：后端真实实现契约
> 关联文档：`docs/prd/auth_rbac.md`（认证/权限参考）、`frontend/specs/email.md`（前端页面结构与设计规划）
> 契约优先级：涉及后端 API、DB schema、共享类型、邮箱协议实现、安全与审计时，以本文档为准。

---

## 1. 概述

### 1.1 目标

在已有的 Portal Backend（Node.js + Express + Drizzle）中新增 **邮件模块**，实现：

1. 用户登录后绑定个人邮箱账号（每用户 **最多 1 个**）
2. 通过 **SMTP** 发送邮件
3. 通过 **IMAP / POP3** 接收邮件（MailboxProvider 抽象层同时支持两种协议）
4. 邮件列表、详情、回复、转发、标记、删除等基础操作
5. 内置 **4 家邮箱服务商预设**：Gmail、163 邮箱、阿里企业邮箱、腾讯企业邮箱

### 1.2 用户故事

```
作为一名已登录的 Portal 用户
我希望在系统内绑定我的工作邮箱
以便在同一个工作台收发邮件、查看邮件列表、回复/转发邮件
而不需要切换到外部邮件客户端
```

### 1.3 不做什么（Non-Goals）

| 不做 | 原因 |
|------|------|
| OAuth2 授权流程（Gmail 等） | Phase 1 仅支持 App Password / 授权码方式 |
| Exchange ActiveSync / Graph API | 首期只支持标准 IMAP/SMTP/POP3 |
| 日历 / 联系人同步 | 仅邮件域 |
| 端到端加密（S/MIME / PGP） | 非核心需求 |
| 邮件规则引擎（自动分类/转发） | 复杂度高，后期考虑 |
| 多人共享邮箱 | 首期仅个人邮箱，每用户 1 个 |
| 阿里/腾讯企业邮 REST API 对接 | 标准 IMAP/SMTP 协议足够 |
| IMAP IDLE 实时推送 | Phase 1 使用轮询，Phase 2 评估 IDLE |
| HashiCorp Vault / 云 KMS | Phase 1 使用 AES-256 本地加密 |

---

## 2. 支持的邮箱服务商

### 2.1 预设列表

| 服务商 | Provider Key | IMAP 地址 | IMAP 端口 | POP3 地址 | POP3 端口 | SMTP 地址 | SMTP 端口 | 安全协议 | 认证方式 | 备注 |
|--------|-------------|-----------|----------|-----------|----------|-----------|----------|---------|---------|------|
| **Gmail** | `gmail` | imap.gmail.com | 993 | pop.gmail.com | 995 | smtp.gmail.com | 587 | STARTTLS (SMTP) / SSL (IMAP/POP3) | App Password | 用户需在 Google 账号生成「应用专用密码」 |
| **163 邮箱** | `netease_163` | imap.163.com | 993 | pop.163.com | 995 | smtp.163.com | 465 | SSL | 授权码 | 用户需在 163 邮箱设置中开启 IMAP/SMTP 并生成授权码 |
| **阿里企业邮箱** | `aliyun_enterprise` | imap.qiye.aliyun.com | 993 | pop.qiye.aliyun.com | 995 | smtp.qiye.aliyun.com | 465 | SSL | 邮箱密码 | 需管理员在阿里企业邮箱后台开启 IMAP/POP3 权限 |
| **腾讯企业邮箱** | `tencent_exmail` | imap.exmail.qq.com | 993 | pop.exmail.qq.com | 995 | smtp.exmail.qq.com | 465 | SSL | 客户端专用密码 | 用户需在腾讯企业邮「安全登录」中生成客户端专用密码 |
| **自定义** | `custom` | 用户填写 | 用户填写 | 用户填写 | 用户填写 | 用户填写 | 用户填写 | 用户选择 | 密码/授权码 | 任意支持标准 IMAP/POP3/SMTP 的邮箱 |

### 2.2 Provider 预设数据结构

```ts
interface ProviderPreset {
  key: ProviderType;
  label: string;
  imap: { host: string; port: number; secure: boolean };
  pop3: { host: string; port: number; secure: boolean };
  smtp: { host: string; port: number; secure: boolean; requireStartTls?: boolean };
  authHint: string;  // 提示用户如何获取凭证
}

type ProviderType =
  | 'gmail'
  | 'netease_163'
  | 'aliyun_enterprise'
  | 'tencent_exmail'
  | 'custom';
```

### 2.3 凭证填写说明

**所有邮箱凭证（授权码 / 应用专用密码 / 客户端专用密码 / 邮箱密码）均由用户在邮箱设置页面中自行填写。** 系统不代为获取或生成任何凭证。

设置页面表单字段「密码 / 授权码」统一使用一个 `password` 输入框（`type="password"`），不同服务商通过 placeholder 和帮助文案引导用户填写正确的凭证类型：

| 服务商 | 凭证类型 | 用户填写内容 | 输入框 placeholder | 帮助提示 |
|--------|---------|------------|-------------------|---------|
| Gmail | 应用专用密码 | 16 位应用专用密码 | `请输入应用专用密码` | 前往 Google 账号 → 安全性 → 两步验证 → 应用专用密码 生成 |
| 163 邮箱 | 授权码 | 邮箱授权码（非登录密码） | `请输入授权码` | 登录 163 邮箱 → 设置 → POP3/SMTP/IMAP → 开启并生成授权码 |
| 阿里企业邮 | 邮箱密码 | 登录密码 | `请输入邮箱密码` | 使用阿里企业邮箱的登录密码，需管理员开启 IMAP/SMTP 权限 |
| 腾讯企业邮 | 客户端专用密码 | 客户端专用密码 | `请输入客户端专用密码` | 登录腾讯企业邮 → 设置 → 安全登录 → 生成客户端专用密码 |
| 自定义 | 密码/授权码 | 按邮箱要求填写 | `请输入密码或授权码` | 请按照您的邮箱服务商要求填写对应凭证 |

### 2.4 设置页面表单结构

```
┌─────────────────────────────────────────────────────────┐
│  邮箱设置                                                │
│                                                         │
│  邮箱服务商   [Gmail ▾]    ← 下拉选择，选后自动填充 host/port   │
│                                                         │
│  邮箱地址     [user@gmail.com     ]                      │
│  显示名称     [张三               ]   (可选)              │
│  用户名       [user@gmail.com     ]   ← 默认与邮箱地址相同  │
│  密码/授权码  [••••••••••••••••   ]   ← 用户自行填写       │
│              ℹ️ 前往 Google 账号生成应用专用密码              │
│                                                         │
│  收件协议     ○ IMAP  ○ POP3    ← 默认 IMAP              │
│                                                         │
│  ── 高级设置（可折叠，预设时默认收起）──                      │
│  IMAP 服务器  [imap.gmail.com    ] 端口 [993 ]           │
│  SMTP 服务器  [smtp.gmail.com    ] 端口 [587 ]           │
│                                                         │
│  [测试连接]                          [取消]  [保存]       │
│                                                         │
│  测试结果：                                               │
│  ✅ IMAP 连接成功                                         │
│  ✅ SMTP 连接成功                                         │
└─────────────────────────────────────────────────────────┘
```

**表单行为规则：**
1. 选择服务商后，自动填充 IMAP/POP3/SMTP 的 host/port，高级设置默认收起
2. 选择「自定义」时，高级设置默认展开，所有 host/port 字段必填
3. 「用户名」默认与「邮箱地址」相同，用户可手动修改
4. 「密码/授权码」为必填项，placeholder 和帮助文案随服务商切换
5. 点击「测试连接」必须通过后，「保存」按钮才可用
6. 测试连接分别显示 IMAP/POP3 和 SMTP 的成功/失败状态及错误原因

---

## 3. 系统架构

### 3.1 模块分层

```
┌────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                            │
│  modules/email/ → hooks/ → services/email-api.ts               │
└──────────────────────────┬─────────────────────────────────────┘
                           │ REST API (JWT Bearer)
┌──────────────────────────▼─────────────────────────────────────┐
│  Backend (Express)  /api/v1/email/*                             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────────────┐  │
│  │ Routes      │  │ Services    │  │ Providers              │  │
│  │ email.ts    │→ │ EmailSvc    │→ │ MailboxProvider (抽象)   │  │
│  │             │  │ SmtpSender  │  │ ├── ImapProvider        │  │
│  │             │  │ SyncSvc     │  │ └── Pop3Provider        │  │
│  │             │  │ CryptoSvc   │  │                        │  │
│  └─────────────┘  └──────┬──────┘  └────────────────────────┘  │
│                          │                                      │
│  ┌───────────────────────▼──────────────────────────────────┐  │
│  │ Data Layer                                                │  │
│  │ ┌──────────────┐ ┌───────────────┐ ┌──────────────────┐  │  │
│  │ │email_accounts│ │email_messages │ │email_attachments │  │  │
│  │ └──────────────┘ └───────────────┘ └──────────────────┘  │  │
│  │ PostgreSQL (Drizzle ORM)     MinIO/S3 (附件)              │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### 3.2 核心组件职责

| 组件 | 职责 |
|------|------|
| **EmailAccountService** | 邮箱账号 CRUD、连接测试、凭证加密/解密 |
| **SmtpSenderService** | 通过 Nodemailer 发送邮件、构建 MIME 消息 |
| **MailboxProvider** | 抽象接口，统一 IMAP/POP3 的收件操作 |
| **ImapProvider** | IMAP 协议实现（imapflow），支持文件夹、Flag、增量同步 |
| **Pop3Provider** | POP3 协议实现，支持 UIDL 去重、RETR 下载 |
| **EmailSyncService** | 定时轮询拉取新邮件、调用 MailboxProvider、去重入库 |
| **EmailMessageService** | 邮件列表查询、详情、标记已读/星标/删除等操作 |
| **CredentialCryptoService** | AES-256-GCM 加密/解密邮箱凭证 |
| **MailParserService** | MIME 解析（mailparser），提取头/正文/附件 |

### 3.3 技术选型

| 能力 | 库 | 版本 | 理由 |
|------|---|------|------|
| SMTP 发信 | `nodemailer` | ^6.x | Node.js 生态最成熟的 SMTP 库 |
| IMAP 收件 | `imapflow` | ^1.x | 现代 Promise/async API，支持 IDLE/文件夹/Flag |
| POP3 收件 | `node-poplib` 或 `mailpop3` | 最新稳定版 | 基础 POP3 UIDL/RETR 能力 |
| MIME 解析 | `mailparser` | ^3.x | Stream 解析大邮件，附件/HTML/Text 提取 |
| 加密存储 | Node.js `crypto` 内置 | — | AES-256-GCM，无额外依赖 |

---

## 4. 数据模型

### 4.1 email_accounts（邮箱账号）

```ts
// packages/db/src/schema/email-accounts.ts

export const emailAccounts = pgTable("email_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  userId: uuid("user_id").notNull().references(() => users.id),

  // 邮箱基本信息
  emailAddress: varchar("email_address", { length: 320 }).notNull(),
  displayName: varchar("display_name", { length: 128 }),
  providerType: varchar("provider_type", { length: 32 }).notNull().default("custom"),

  // 收件协议选择
  receiveProtocol: varchar("receive_protocol", { length: 8 }).notNull().default("imap"),

  // IMAP 配置
  imapHost: varchar("imap_host", { length: 255 }),
  imapPort: integer("imap_port"),
  imapSecure: boolean("imap_secure").default(true),

  // POP3 配置
  pop3Host: varchar("pop3_host", { length: 255 }),
  pop3Port: integer("pop3_port"),
  pop3Secure: boolean("pop3_secure").default(true),

  // SMTP 配置
  smtpHost: varchar("smtp_host", { length: 255 }).notNull(),
  smtpPort: integer("smtp_port").notNull(),
  smtpSecure: boolean("smtp_secure").default(true),
  smtpRequireStartTls: boolean("smtp_require_starttls").default(false),

  // 凭证（AES-256-GCM 加密后存储）
  username: varchar("username", { length: 320 }).notNull(),
  encryptedPassword: text("encrypted_password").notNull(),
  passwordIv: varchar("password_iv", { length: 32 }).notNull(),
  passwordAuthTag: varchar("password_auth_tag", { length: 32 }).notNull(),

  // 同步配置
  syncEnabled: boolean("sync_enabled").notNull().default(true),
  syncIntervalSeconds: integer("sync_interval_seconds").notNull().default(300),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  lastSyncError: text("last_sync_error"),

  // 状态
  status: varchar("status", { length: 32 }).notNull().default("active"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  unique("uq_email_accounts_user").on(table.userId),
  check("chk_email_accounts_status",
    sql`${table.status} IN ('active', 'error', 'syncing', 'disconnected', 'deleted')`),
  check("chk_email_accounts_protocol",
    sql`${table.receive_protocol} IN ('imap', 'pop3')`),
  check("chk_email_accounts_provider",
    sql`${table.provider_type} IN ('gmail', 'netease_163', 'aliyun_enterprise', 'tencent_exmail', 'custom')`),
]);
```

> **每用户最多 1 个邮箱**：通过 `unique("uq_email_accounts_user").on(table.userId)` 约束实现。

### 4.2 email_messages（邮件消息）

```ts
// packages/db/src/schema/email-messages.ts

export const emailMessages = pgTable("email_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull(),
  emailAccountId: uuid("email_account_id").notNull()
    .references(() => emailAccounts.id),

  // 方向
  direction: varchar("direction", { length: 16 }).notNull(),

  // 协议标识
  providerUid: varchar("provider_uid", { length: 255 }),
  messageId: varchar("message_id", { length: 998 }),
  threadId: varchar("thread_id", { length: 998 }),

  // 信封
  fromAddress: varchar("from_address", { length: 320 }),
  fromName: varchar("from_name", { length: 255 }),
  toAddresses: jsonb("to_addresses").notNull().default([]),
  ccAddresses: jsonb("cc_addresses").notNull().default([]),
  bccAddresses: jsonb("bcc_addresses").notNull().default([]),
  replyToAddresses: jsonb("reply_to_addresses").notNull().default([]),

  subject: text("subject"),
  snippet: varchar("snippet", { length: 500 }),
  textBody: text("text_body"),
  htmlBody: text("html_body"),

  // 时间
  date: timestamp("date", { withTimezone: true }),
  receivedAt: timestamp("received_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),

  // 状态
  isRead: boolean("is_read").notNull().default(false),
  isStarred: boolean("is_starred").notNull().default(false),
  isDeleted: boolean("is_deleted").notNull().default(false),

  // IMAP 文件夹
  folderPath: varchar("folder_path", { length: 512 }).default("INBOX"),
  folderType: varchar("folder_type", { length: 32 }).default("inbox"),

  // 附件标记
  hasAttachments: boolean("has_attachments").notNull().default(false),

  // 引用链
  inReplyTo: varchar("in_reply_to", { length: 998 }),
  references: jsonb("references_list").notNull().default([]),

  // 关联
  relatedTaskId: uuid("related_task_id"),

  // 原始邮件存储 key（S3）
  rawStorageKey: text("raw_storage_key"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("uq_email_messages_account_uid").on(table.emailAccountId, table.providerUid),
  check("chk_email_messages_direction",
    sql`${table.direction} IN ('inbound', 'outbound')`),
  check("chk_email_messages_folder_type",
    sql`${table.folder_type} IN ('inbox', 'sent', 'drafts', 'trash', 'spam', 'starred', 'archive', 'custom')`),
]);
```

### 4.3 email_attachments（邮件附件）

```ts
// packages/db/src/schema/email-attachments.ts

export const emailAttachments = pgTable("email_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").notNull(),
  emailMessageId: uuid("email_message_id").notNull()
    .references(() => emailMessages.id),

  filename: text("filename"),
  contentType: varchar("content_type", { length: 255 }),
  sizeBytes: bigint("size_bytes", { mode: "number" }),
  storageKey: text("storage_key").notNull(),
  sha256: varchar("sha256", { length: 64 }),
  contentId: varchar("content_id", { length: 255 }),
  isInline: boolean("is_inline").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### 4.4 email_sync_logs（同步日志）

```ts
// packages/db/src/schema/email-sync-logs.ts

export const emailSyncLogs = pgTable("email_sync_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  emailAccountId: uuid("email_account_id").notNull()
    .references(() => emailAccounts.id),

  syncType: varchar("sync_type", { length: 16 }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  status: varchar("status", { length: 16 }).notNull().default("running"),
  messagesFound: integer("messages_found").default(0),
  messagesSynced: integer("messages_synced").default(0),
  errorMessage: text("error_message"),
});
```

---

## 5. API 端点设计

> 所有端点在 `/api/v1/email/` 路径下，需要 JWT 认证。

### 5.1 邮箱账号管理

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | `/email/account` | 获取当前用户的邮箱账号 | — | `EmailAccount \| null` |
| POST | `/email/account` | 绑定邮箱账号 | `CreateEmailAccountRequest` | `EmailAccount` |
| PATCH | `/email/account` | 更新邮箱配置 | `UpdateEmailAccountRequest` | `EmailAccount` |
| DELETE | `/email/account` | 解绑邮箱账号 | — | `{ ok: true }` |
| POST | `/email/account/test` | 测试邮箱连接 | `TestConnectionRequest` | `TestConnectionResult` |

> 因为每用户限 1 个邮箱，所以使用 `/email/account`（单数）而非 `/email/accounts/:id`。

### 5.2 邮件操作

| 方法 | 路径 | 说明 | 请求体/参数 | 响应 |
|------|------|------|------------|------|
| GET | `/email/messages` | 邮件列表（分页/筛选） | query: `EmailListParams` | `EmailListResponse` |
| GET | `/email/messages/:messageId` | 邮件详情 | — | `EmailMessage` |
| POST | `/email/messages/send` | 发送邮件 | `SendEmailRequest` | `{ messageId: string }` |
| PATCH | `/email/messages/:messageId` | 更新标记（已读/星标） | `{ isRead?, isStarred? }` | `EmailMessage` |
| DELETE | `/email/messages/:messageId` | 移到回收站/永久删除 | query: `permanent?=false` | `{ ok: true }` |
| POST | `/email/messages/actions` | 批量操作 | `BatchActionRequest` | `{ affected: number }` |

### 5.3 文件夹

| 方法 | 路径 | 说明 | 响应 |
|------|------|------|------|
| GET | `/email/folders` | 获取文件夹列表（含未读计数） | `EmailFolder[]` |

### 5.4 同步

| 方法 | 路径 | 说明 | 响应 |
|------|------|------|------|
| POST | `/email/sync` | 手动触发同步 | `{ syncedCount: number, status: string }` |
| GET | `/email/sync/status` | 获取同步状态 | `{ lastSyncAt, status, error? }` |

### 5.5 附件

| 方法 | 路径 | 说明 | 响应 |
|------|------|------|------|
| GET | `/email/attachments/:attachmentId` | 下载附件 | `binary stream` |
| GET | `/email/attachments/:attachmentId?preview=true` | 预览附件（图片缩略图等） | `binary stream` |

---

## 6. 数据契约（TypeScript 类型）

### 6.1 邮箱账号

```ts
type ProviderType = 'gmail' | 'netease_163' | 'aliyun_enterprise' | 'tencent_exmail' | 'custom';
type ReceiveProtocol = 'imap' | 'pop3';
type ConnectionSecurity = 'ssl' | 'starttls' | 'none';
type AccountStatus = 'active' | 'error' | 'syncing' | 'disconnected';

interface EmailAccount {
  id: string;
  userId: string;
  emailAddress: string;
  displayName: string | null;
  providerType: ProviderType;
  receiveProtocol: ReceiveProtocol;
  imapHost: string | null;
  imapPort: number | null;
  pop3Host: string | null;
  pop3Port: number | null;
  smtpHost: string;
  smtpPort: number;
  status: AccountStatus;
  syncEnabled: boolean;
  syncIntervalSeconds: number;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateEmailAccountRequest {
  emailAddress: string;
  displayName?: string;
  providerType: ProviderType;
  receiveProtocol: ReceiveProtocol;

  // 收件配置（选择 provider 预设时自动填充，custom 手动填写）
  imapHost?: string;
  imapPort?: number;
  pop3Host?: string;
  pop3Port?: number;

  // 发件配置
  smtpHost: string;
  smtpPort: number;

  // 凭证（用户在设置页面自行填写）
  username: string;              // 默认与 emailAddress 相同，用户可修改
  password: string;              // 密码 / 授权码 / 应用专用密码（按服务商要求），传输后后端 AES-256 加密存储

  // 可选
  syncIntervalSeconds?: number;  // 默认 300
}

interface TestConnectionRequest {
  providerType: ProviderType;
  receiveProtocol: ReceiveProtocol;
  imapHost?: string;
  imapPort?: number;
  pop3Host?: string;
  pop3Port?: number;
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
}

interface TestConnectionResult {
  receive: { protocol: ReceiveProtocol; success: boolean; error?: string };
  smtp: { success: boolean; error?: string };
}
```

### 6.2 邮件消息

```ts
interface EmailAddress {
  name?: string;
  address: string;
}

interface EmailMessage {
  id: string;
  emailAccountId: string;
  direction: 'inbound' | 'outbound';
  messageId: string | null;
  threadId: string | null;
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  replyTo: EmailAddress[];
  subject: string | null;
  snippet: string | null;
  textBody: string | null;
  htmlBody: string | null;
  date: string | null;
  receivedAt: string | null;
  sentAt: string | null;
  isRead: boolean;
  isStarred: boolean;
  isDeleted: boolean;
  folderPath: string;
  folderType: FolderType;
  hasAttachments: boolean;
  attachments: EmailAttachment[];
  inReplyTo: string | null;
  references: string[];
  relatedTaskId: string | null;
  createdAt: string;
}

type FolderType = 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'starred' | 'archive' | 'custom';

interface EmailFolder {
  name: string;
  path: string;
  type: FolderType;
  unreadCount: number;
  totalCount: number;
}
```

### 6.3 请求/响应

```ts
interface EmailListParams {
  folderId?: string;
  folderType?: FolderType;
  search?: string;
  isRead?: boolean;
  isStarred?: boolean;
  hasAttachments?: boolean;
  page?: number;        // 默认 1
  pageSize?: number;    // 默认 50
  sortBy?: 'date' | 'from' | 'subject';
  sortOrder?: 'asc' | 'desc';
}

interface EmailListResponse {
  items: EmailMessage[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface SendEmailRequest {
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  inReplyTo?: string;
  references?: string[];
  attachmentIds?: string[];
}

interface BatchActionRequest {
  messageIds: string[];
  action: 'markRead' | 'markUnread' | 'star' | 'unstar' | 'trash' | 'delete' | 'archive' | 'move';
  targetFolder?: string;
}
```

---

## 7. 核心流程

### 7.1 邮箱绑定流程

```
用户登录 Portal
  │
  ├─ GET /email/account → 无账号 → 显示「邮箱设置」引导页
  │
  ├─ 用户在设置页面中操作：
  │   ├─ 1. 选择服务商（Gmail / 163 / 阿里企业邮 / 腾讯企业邮 / 自定义）
  │   │      → 自动填充预设的 IMAP/SMTP host/port
  │   │
  │   ├─ 2. 填写邮箱地址、显示名称
  │   │
  │   ├─ 3. 填写用户名（默认与邮箱地址相同，可修改）
  │   │
  │   ├─ 4. 自行填写密码/授权码/应用专用密码
  │   │      → 根据所选服务商显示对应的帮助提示
  │   │      → 例如 Gmail 提示「前往 Google 账号生成应用专用密码」
  │   │
  │   ├─ 5. 选择收件协议（IMAP / POP3，默认 IMAP）
  │   │
  │   └─ 6. 高级设置（可选）：手动修改 host/port
  │
  ├─ POST /email/account/test → 分别测试收件(IMAP/POP3) + 发件(SMTP) 连接
  │   ├─ 成功 → 「保存」按钮激活
  │   └─ 失败 → 显示具体错误（认证失败/服务器不可达/端口错误等）
  │
  └─ POST /email/account → 创建账号
      ├─ 后端 AES-256-GCM 加密密码存入 DB
      ├─ 触发首次同步（最近 30 天邮件）
      └─ 返回账号信息
```

### 7.2 发件流程（SMTP）

```
用户填写收件人/主题/正文 → POST /email/messages/send
  │
  ├─ 1. 鉴权：验证 JWT，确认用户有已绑定的邮箱账号
  │
  ├─ 2. 解密凭证：从 DB 读取加密凭证 → AES-256-GCM 解密
  │
  ├─ 3. 构建邮件：Nodemailer 构建 MIME 消息
  │   ├─ from: 用户绑定的邮箱地址
  │   ├─ to / cc / bcc: 请求中的收件人
  │   ├─ subject / html / text: 请求中的内容
  │   ├─ inReplyTo / references: 回复/转发时的引用链
  │   └─ attachments: 从 S3 读取已上传的附件
  │
  ├─ 4. 发送：通过 SMTP transport 发送
  │   ├─ 成功 → 获取 messageId
  │   └─ 失败 → 返回错误（认证失败 / 收件人无效 / 服务器拒绝等）
  │
  ├─ 5. 入库：将发出的邮件存入 email_messages（direction = 'outbound'）
  │
  ├─ 6. 审计：写入 audit_events（操作=email.send, 收件人, 主题）
  │
  └─ 7. 返回 { messageId }
```

### 7.3 收件流程（IMAP）

```
定时轮询 / 手动触发同步
  │
  ├─ 1. 从 DB 加载活跃邮箱账号（status = 'active', syncEnabled = true）
  │
  ├─ 2. 解密凭证
  │
  ├─ 3. ImapFlow 连接邮箱服务器
  │   ├─ 连接失败 → 更新 status='error', lastSyncError
  │   └─ 连接成功 → 继续
  │
  ├─ 4. 打开 INBOX（及其他文件夹）
  │   └─ SEARCH SINCE <lastSyncDate> 或 SEARCH UNSEEN
  │
  ├─ 5. 逐封 FETCH 新邮件
  │   ├─ 解析 MIME（mailparser）
  │   ├─ 提取 from/to/cc/subject/text/html
  │   ├─ 提取附件 → 存储到 S3 → 记录 email_attachments
  │   ├─ 生成 snippet（纯文本前 200 字）
  │   ├─ 使用 message-id + account 做去重（UNIQUE 约束）
  │   └─ 插入 email_messages（direction = 'inbound'）
  │
  ├─ 6. 更新账号：lastSyncAt = now()，status = 'active'
  │
  └─ 7. 写入 email_sync_logs
```

### 7.4 收件流程（POP3）

```
定时轮询 / 手动触发同步
  │
  ├─ 1. 从 DB 加载 receiveProtocol='pop3' 的活跃账号
  │
  ├─ 2. 解密凭证
  │
  ├─ 3. POP3 连接邮箱服务器（USER/PASS 认证）
  │
  ├─ 4. LIST + UIDL 获取邮件列表和唯一标识
  │
  ├─ 5. 对比 DB 中已存在的 provider_uid，过滤出新邮件
  │
  ├─ 6. RETR 下载新邮件
  │   ├─ mailparser 解析 MIME
  │   ├─ 提取信封/正文/附件（同 IMAP 流程）
  │   └─ 插入 email_messages + email_attachments
  │
  ├─ 7. QUIT（不执行 DELE，保留服务器邮件）
  │
  └─ 8. 更新 lastSyncAt，写入 email_sync_logs
```

---

## 8. MailboxProvider 抽象层

```ts
// backend/src/services/email/providers/mailbox-provider.ts

interface FetchedMessage {
  uid: string;
  messageId: string | null;
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  replyTo: EmailAddress[];
  subject: string | null;
  textBody: string | null;
  htmlBody: string | null;
  date: Date | null;
  inReplyTo: string | null;
  references: string[];
  attachments: FetchedAttachment[];
  flags: string[];
  folderPath: string;
}

interface FetchedAttachment {
  filename: string | null;
  contentType: string;
  size: number;
  content: Buffer;
  contentId: string | null;
  isInline: boolean;
}

interface FolderInfo {
  name: string;
  path: string;
  specialUse: string | null;
  totalMessages: number;
  unseenMessages: number;
}

interface MailboxProvider {
  connect(config: ReceiveConfig): Promise<void>;
  disconnect(): Promise<void>;

  listFolders(): Promise<FolderInfo[]>;
  fetchNewMessages(since: Date | null): Promise<FetchedMessage[]>;
  fetchMessageByUid(uid: string): Promise<FetchedMessage | null>;

  markAsRead(uids: string[]): Promise<void>;
  markAsStarred(uids: string[]): Promise<void>;
  moveToFolder(uids: string[], targetFolder: string): Promise<void>;
  deleteMessages(uids: string[]): Promise<void>;
}

interface ReceiveConfig {
  protocol: 'imap' | 'pop3';
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}
```

> **POP3 限制**：`listFolders()` 返回固定 `[{ name: 'INBOX', path: 'INBOX', ... }]`；`markAsRead()` / `moveToFolder()` 等仅操作本地 DB，不同步回服务器（POP3 协议不支持这些操作）。

---

## 9. 凭证加密方案

### 9.1 AES-256-GCM 加密

```ts
// backend/src/services/email/credential-crypto.service.ts

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export class CredentialCryptoService {
  private key: Buffer;

  constructor(encryptionKey: string) {
    // encryptionKey 为 64 字符 hex 字符串（32 bytes）
    this.key = Buffer.from(encryptionKey, 'hex');
  }

  encrypt(plaintext: string): { encrypted: string; iv: string; authTag: string } {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv, { authTagLength: AUTH_TAG_LENGTH });
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
      encrypted: encrypted.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  decrypt(encrypted: string, iv: string, authTag: string): string {
    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(iv, 'hex'), {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
  }
}
```

### 9.2 环境变量

```env
# .env — 邮箱凭证加密密钥（64 字符 hex = 32 bytes）
EMAIL_CREDENTIAL_ENCRYPTION_KEY=<64-char-hex-string>
```

### 9.3 后续扩展路径

Phase 2+ 可替换为 HashiCorp Vault / AWS KMS / Azure Key Vault，通过 `CredentialProvider` 接口抽象：

```ts
interface CredentialProvider {
  encrypt(plaintext: string): Promise<EncryptedCredential>;
  decrypt(credential: EncryptedCredential): Promise<string>;
}
```

---

## 10. 同步策略

### 10.1 Phase 1 — 轮询

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `syncIntervalSeconds` | 300 (5分钟) | 每个账号的轮询间隔 |
| 首次同步范围 | 最近 30 天 | 绑定账号后首次同步拉取范围 |
| 增量同步 | SEARCH SINCE \<lastSyncDate\> | 后续每次同步只拉取新邮件 |
| 并发控制 | 同一时间每个账号只允许 1 个同步任务 | 防止重复同步 |
| 失败重试 | 最多 3 次，指数退避 | 连接失败时的重试策略 |
| 失败锁定 | 连续 5 次失败后暂停同步 | 更新 status='error'，需用户手动恢复 |

### 10.2 同步调度器

```ts
// backend/src/services/email/email-sync-scheduler.ts

export class EmailSyncScheduler {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  startForAccount(accountId: string, intervalMs: number): void { /* ... */ }
  stopForAccount(accountId: string): void { /* ... */ }
  triggerNow(accountId: string): Promise<SyncResult> { /* ... */ }
  stopAll(): void { /* ... */ }
}
```

### 10.3 Phase 2 — IMAP IDLE（未来）

Phase 2 评估引入 IMAP IDLE 长连接，实现准实时邮件推送。需要考虑：
- 每个账号维持一个持久 IMAP 连接（资源消耗）
- 连接心跳与自动重连
- IDLE 超时时退化为轮询
- 服务器重启时的连接恢复

---

## 11. 安全设计

### 11.1 凭证安全

| 层级 | 措施 |
|------|------|
| 传输 | HTTPS 强制（生产环境） |
| 存储 | AES-256-GCM 加密，密钥通过环境变量注入 |
| 访问 | 密码解密仅在发件/同步时进行，API 响应中永远不返回密码 |
| 密钥轮转 | 支持多密钥版本（`key_version` 字段预留） |

### 11.2 邮件内容安全

| 风险 | 措施 |
|------|------|
| XSS | HTML 邮件正文在前端 iframe sandbox 中渲染，后端不做过滤 |
| SSRF | 附件下载通过 backend 代理，前端不直连存储 |
| 注入 | 所有查询使用 Drizzle ORM 参数化，不拼接 SQL |
| 越权 | 所有端点校验 `userId` 匹配邮箱所有者 |

### 11.3 权限检查

```ts
// 所有邮件端点的权限逻辑：

async function ensureEmailAccountOwner(req: Request): EmailAccount {
  const account = await emailAccountRepo.findByUserId(db, req.ctx.userId);
  if (!account) throw new NotFoundError("No email account bound");
  return account;
}

// 邮件消息操作额外检查 message 归属
async function ensureMessageOwner(req: Request, messageId: string): EmailMessage {
  const account = await ensureEmailAccountOwner(req);
  const message = await emailMessageRepo.findById(db, messageId);
  if (!message || message.emailAccountId !== account.id) {
    throw new NotFoundError("Message not found");
  }
  return message;
}
```

---

## 12. 目录结构

```
backend/src/
├── services/
│   └── email/
│       ├── index.ts                          # 模块导出
│       ├── email-account.service.ts          # 邮箱账号 CRUD + 连接测试
│       ├── email-message.service.ts          # 邮件列表/详情/标记/删除
│       ├── smtp-sender.service.ts            # SMTP 发送
│       ├── email-sync.service.ts             # 同步核心逻辑
│       ├── email-sync-scheduler.ts           # 定时轮询调度
│       ├── credential-crypto.service.ts      # AES-256-GCM 凭证加密
│       ├── mail-parser.service.ts            # MIME 解析
│       ├── provider-presets.ts               # 服务商预设配置
│       ├── errors.ts                         # 邮件模块专用错误
│       ├── providers/
│       │   ├── mailbox-provider.ts           # 抽象接口
│       │   ├── imap-provider.ts              # IMAP 实现 (imapflow)
│       │   └── pop3-provider.ts              # POP3 实现
│       └── repository/
│           ├── email-account.repository.ts   # 账号 DB 操作
│           ├── email-message.repository.ts   # 邮件 DB 操作
│           ├── email-attachment.repository.ts# 附件 DB 操作
│           └── email-sync-log.repository.ts  # 同步日志 DB 操作
├── routes/
│   ├── documents.ts                          # 现有
│   ├── health.ts                             # 现有
│   └── email.ts                              # 新增：邮件路由
└── ...

packages/db/src/schema/
├── email-accounts.ts                         # 新增
├── email-messages.ts                         # 新增
├── email-attachments.ts                      # 新增
├── email-sync-logs.ts                        # 新增
└── index.ts                                  # 新增 export

packages/shared/src/
├── types/
│   └── email.ts                              # 新增：邮件类型定义
└── validators/
    └── email.ts                              # 新增：Zod 验证 schema
```

---

## 13. 配置变更

### 13.1 config.ts 新增字段

```ts
// 在 configSchema 中新增
emailCredentialEncryptionKey: z.string().length(64, "EMAIL_CREDENTIAL_ENCRYPTION_KEY must be 64 hex chars"),
emailDefaultSyncIntervalSec: z.coerce.number().default(300),
emailSyncEnabled: z.coerce.boolean().default(true),
emailMaxAttachmentBytes: z.coerce.number().default(25 * 1024 * 1024), // 25MB
emailAttachmentBucket: z.string().default("portal-email-attachments"),
```

### 13.2 .env.example 新增

```env
# ===== Email Module =====
EMAIL_CREDENTIAL_ENCRYPTION_KEY=<64-char-hex-string-for-aes256>
EMAIL_DEFAULT_SYNC_INTERVAL_SEC=300
EMAIL_SYNC_ENABLED=true
EMAIL_MAX_ATTACHMENT_BYTES=26214400
EMAIL_ATTACHMENT_BUCKET=portal-email-attachments
```

### 13.3 package.json 新增依赖

```json
{
  "dependencies": {
    "nodemailer": "^6.9.0",
    "imapflow": "^1.0.0",
    "mailparser": "^3.7.0"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.4.0"
  }
}
```

---

## 14. 错误处理

### 14.1 邮件模块错误码

| HTTP 状态码 | 错误类型 | 说明 |
|------------|---------|------|
| 400 | `EMAIL_INVALID_CONFIG` | 邮箱配置参数无效 |
| 400 | `EMAIL_SEND_FAILED` | 邮件发送失败（SMTP 拒绝） |
| 401 | `EMAIL_AUTH_FAILED` | 邮箱认证失败（密码错误/授权码过期） |
| 404 | `EMAIL_ACCOUNT_NOT_FOUND` | 用户未绑定邮箱 |
| 404 | `EMAIL_MESSAGE_NOT_FOUND` | 邮件不存在或无权限访问 |
| 409 | `EMAIL_ACCOUNT_EXISTS` | 用户已绑定邮箱（每用户限 1 个） |
| 422 | `EMAIL_CONNECTION_FAILED` | 无法连接邮件服务器 |
| 429 | `EMAIL_SYNC_IN_PROGRESS` | 同步正在进行中，请稍后 |
| 500 | `EMAIL_SYNC_FAILED` | 同步过程中发生错误 |
| 500 | `EMAIL_DECRYPT_FAILED` | 凭证解密失败（密钥不匹配） |

---

## 15. 审计日志

所有邮件操作写入 `audit_events` 表：

| 操作 | event_type | payload 内容 |
|------|------------|-------------|
| 绑定邮箱 | `email.account.create` | `{ provider, emailAddress }` |
| 解绑邮箱 | `email.account.delete` | `{ emailAddress }` |
| 发送邮件 | `email.message.send` | `{ to, subject, messageId }` |
| 同步邮件 | `email.sync.complete` | `{ syncedCount, duration }` |
| 下载附件 | `email.attachment.download` | `{ attachmentId, filename }` |
| 批量操作 | `email.message.batch_action` | `{ action, count }` |

---

## 16. 实现阶段

### Phase 1：核心收发（本期）

| Step | 任务 | 产出 |
|------|------|------|
| 1 | DB Schema：email_accounts / email_messages / email_attachments / email_sync_logs | 4 个 Drizzle schema 文件 + migration |
| 2 | shared 类型 + Zod validators | types/email.ts + validators/email.ts |
| 3 | CredentialCryptoService | AES-256-GCM 加密/解密 |
| 4 | Provider 预设配置 | 4 家服务商 host/port 预设 |
| 5 | EmailAccountService + 路由 | 账号绑定/解绑/测试连接 |
| 6 | ImapProvider + Pop3Provider | MailboxProvider 抽象 + 两种协议实现 |
| 7 | MailParserService | MIME 解析、附件提取 |
| 8 | SmtpSenderService + 路由 | 发件功能 |
| 9 | EmailSyncService + Scheduler | 增量同步 + 定时轮询 |
| 10 | EmailMessageService + 路由 | 列表/详情/标记/删除/批量操作 |
| 11 | 文件夹路由 | 文件夹列表 + 未读计数 |
| 12 | 附件下载路由 | 附件流式下载 |
| 13 | 审计日志集成 | 关键操作写入 audit_events |
| 14 | 集成测试 | 连接测试、收发邮件端到端验证 |

### Phase 2：增强能力（后续）

| 任务 | 说明 |
|------|------|
| IMAP IDLE 实时推送 | 替代轮询，准实时收件通知 |
| 附件预览服务 | 图片缩略图、PDF 渲染 |
| 全文搜索 | PostgreSQL tsvector 或外部搜索引擎 |
| 密钥管理扩展 | 对接 HashiCorp Vault / 云 KMS |
| 邮件线程合并 | 基于 References / In-Reply-To 构建邮件线程 |
| 草稿功能 | 自动保存/恢复编辑中的邮件草稿 |

### Phase 3：AI + Workflow（远期）

| 任务 | 说明 |
|------|------|
| AI 邮件摘要 | CopilotKit 集成，自动生成长邮件摘要 |
| AI 回复生成 | 基于邮件上下文生成回复草稿 |
| Workflow Task 创建 | 从邮件内容自动提取任务字段 |
| 邮件事件路由 | 收件转为业务事件（客户询价、订单回复等） |

---

## 17. 验收标准（Phase 1 DoD）

| 验收项 | 标准 |
|--------|------|
| 账号绑定 | 用户可选择 4 家预设服务商或自定义，绑定成功 |
| 连接测试 | 分别测试 IMAP/POP3 + SMTP 连接，显示成功/失败 |
| 收件（IMAP） | 绑定后首次同步拉取最近 30 天邮件，后续增量同步 |
| 收件（POP3） | UIDL 去重，正确拉取新邮件 |
| 发件（SMTP） | 发送邮件成功，收件方能收到 |
| 邮件列表 | 分页、搜索、按文件夹筛选正常 |
| 邮件详情 | 正确展示 from/to/cc/subject/body/attachments |
| 标记操作 | 已读/未读/星标/取消星标正常 |
| 删除 | 移到回收站 / 永久删除正常 |
| 回复/转发 | 正确设置 In-Reply-To / References 引用头 |
| 轮询同步 | 按配置间隔自动拉取新邮件 |
| 凭证安全 | 密码 AES-256-GCM 加密存储，API 不泄露 |
| 权限隔离 | 用户只能访问自己的邮箱和邮件 |
| 审计日志 | 关键操作有审计记录 |
| 类型安全 | 无 `any` 泄漏，shared 类型与 backend 一致 |
| 测试 | 核心加密/解密、MIME 解析有单元测试 |

---

## 附录 A：各服务商 IMAP/POP3/SMTP 详细配置

### Gmail

```
IMAP: imap.gmail.com:993 (SSL/TLS)
POP3: pop.gmail.com:995 (SSL/TLS)
SMTP: smtp.gmail.com:587 (STARTTLS) 或 465 (SSL)
认证: 需开启两步验证 → 生成 App Password
注意: 需在 Gmail 设置中启用 IMAP / POP3
```

### 163 邮箱

```
IMAP: imap.163.com:993 (SSL)
POP3: pop.163.com:995 (SSL)
SMTP: smtp.163.com:465 (SSL) 或 25 (非加密)
认证: 在设置 → POP3/SMTP/IMAP 中开启并生成授权码
注意: 使用授权码替代登录密码
```

### 阿里企业邮箱 (qiye.aliyun.com)

```
IMAP: imap.qiye.aliyun.com:993 (SSL)
POP3: pop.qiye.aliyun.com:995 (SSL)
SMTP: smtp.qiye.aliyun.com:465 (SSL)
认证: 邮箱密码（管理员需在后台开启 IMAP/POP3 权限）
文档: https://help.aliyun.com/document_detail/36576.html
```

### 腾讯企业邮箱 (exmail.qq.com)

```
IMAP: imap.exmail.qq.com:993 (SSL)
POP3: pop.exmail.qq.com:995 (SSL)
SMTP: smtp.exmail.qq.com:465 (SSL)
认证: 客户端专用密码（在「安全登录」中生成）
文档: https://service.exmail.qq.com/cgi-bin/help?subtype=1&&id=28&&no=1001256
```

---

## 附录 B：与现有系统的集成点

| 集成点 | 说明 |
|--------|------|
| **auth middleware** | 复用现有 `authMiddleware`，从 `req.ctx.userId` 获取当前用户 |
| **users 表** | `email_accounts.userId` 外键关联 |
| **workspaces 表** | `email_accounts.workspaceId` 外键关联 |
| **audit_events 表** | 邮件操作写入审计日志 |
| **S3/MinIO 存储** | 附件存储复用现有 S3 客户端，使用独立 bucket |
| **Drizzle ORM** | 复用 `@portal/db` 的 createDb 和 schema 导出 |

---

## 附录 C：未来扩展考量

| 方向 | 说明 |
|------|------|
| 多邮箱支持 | 去掉 `unique(userId)` 约束，改为配额限制 |
| OAuth2 | 增加 Gmail/Outlook OAuth2 授权流程，存储 refresh_token |
| 邮件模板 | 预设回复模板，支持变量替换 |
| 邮件签名 | 账号级 HTML 签名，自动追加到发件末尾 |
| 标签/分类 | 自定义标签系统，支持按标签筛选 |
| 联系人提取 | 从邮件自动提取联系人信息 |
| 通知集成 | 新邮件通知推送（WebSocket / Server-Sent Events） |
