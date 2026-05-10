# Email 模块前端规格

> 路由页为瘦壳，业务在 `modules/email/`。后端契约以 `docs/prd/email/core_email_prd.md` 为准。
> 前端通过 `services/email-api.ts` 请求 `/api/email/*`，由 `frontend/middleware.ts` 代理到 backend `/api/v1/email/*`。
> 鉴权：`axios` 拦截器附带内存中的 Bearer（与 `tokenManager` 一致），附件下载使用 `fetch` + Bearer。

---

## 一、页面路由

| 路由 | 页面组件 | 说明 |
| --- | --- | --- |
| `app/[lang]/(dashboard)/(apps)/email/page.tsx` | `EmailWorkspacePage` | 邮箱工作区；数据在客户端加载（RSC 无法访问内存 Token） |

---

## 二、Layout Decision

| 项 | 决策 |
| --- | --- |
| route type | existing page modification；dashboard route |
| selected page template | `DataManagementTemplate` |
| shell inheritance | 继承 Header、Sidebar、Footer、ThemeCustomize、Auth protection、i18n、DirectionProvider、GlobalCopilotProvider |
| layout files | 瘦壳 `page.tsx`；无页面级 `layout.tsx`；无模块级 WorkspaceLayout |
| Copilot behavior | 不新建 Provider；不强制注册页面 Copilot 上下文 |
| forbidden changes | 不修改 `app/[lang]/layout.tsx`、`app/[lang]/(dashboard)/layout.tsx`、`provider/*`、`components/ui/*` |

---

## 三、模块目录结构

```txt
modules/email/
├── components/
│   ├── email-workspace.tsx         # 工作区：账号缺失 CTA、侧栏文件夹、列表、详情
│   ├── email-header.tsx            # 工具栏：搜索、同步、已读筛选
│   ├── email-sidebar-nav.tsx       # 文件夹导航（真实 folders + 未读/总数）
│   ├── email-account-form.tsx      # 绑定/编辑账号（Zod + 服务商预设）
│   ├── email-account-card.tsx      # 账号摘要、测试连接、编辑、删除
│   ├── email-attachment-list.tsx   # 附件列表与 Bearer 下载
│   ├── email-list.tsx              # 列表行（星标/删除，shared 类型）
│   ├── email-detail.tsx            # 详情（iframe 展示 HTML、标记已读）
│   ├── email-compose-form.tsx      # 撰写（Quill + SendEmailRequest）
│   ├── email-labels.tsx            # （保留）标签 UI，当前工作区未挂载
│   ├── email-spam-dialog.tsx
│   ├── email-contact-list.tsx
│   └── email-chat-box.tsx
├── pages/
│   ├── email-workspace-page.tsx    # 仅读取布局 cookie，挂载 EmailWorkspace
│   └── email-settings-page.tsx     # 占位说明（设置整合在工作区侧栏）
├── stores/
│   ├── email-store.ts              # 选中邮件（EmailMessageResponse）
│   └── email-account-store.ts      # 缓存账号、上次连接测试结果
├── hooks/
│   ├── use-email-sync.ts           # 手动同步 + 错误状态
│   └── use-email-permission.ts     # RBAC 宽松策略（permissions 空则放行）
├── lib/
│   ├── email-errors.ts             # API 错误归一化
│   ├── email-address-utils.ts      # 收件人解析、附件大小格式化
│   ├── folder-icons.ts             # 文件夹图标映射
│   └── provider-presets.ts         # Gmail/163/企业邮等预设
├── constants/
│   └── permissions.ts              # EMAIL_PERMISSION.* 与 UI 对齐
├── services/
│   └── email-api.ts                # Phase 1 REST 全量封装，返回 EmailResult<T>
├── types/
│   ├── email-result.ts             # EmailResult / EmailClientError
│   └── email-view.ts               # 非契约视图类型（联系人等）
└── tests/
    ├── email-errors.test.ts
    ├── email-address-utils.test.ts
    └── use-email-sync.test.ts
```

---

## 四、权限与操作（前端）

| 权限常量 | 用途 |
| --- | --- |
| `EMAIL_PERMISSION.ACCOUNT_MANAGE` | 绑定、编辑、删除账号 |
| `EMAIL_PERMISSION.ACCOUNT_TEST` | 测试连接 |
| `EMAIL_PERMISSION.MESSAGE_READ` | （预留）列表/详情 |
| `EMAIL_PERMISSION.MESSAGE_SEND` | 撰写发送 |
| `EMAIL_PERMISSION.MESSAGE_MUTATE` | 星标、删除 |
| `EMAIL_PERMISSION.SYNC_RUN` | 手动同步按钮 |

> 若 `auth-store` 中 `permissions` 仍为空数组，则 `useEmailPermission` 视为允许（由后端强校验）。

---

## 五、后端 API（与实现一致）

| 前端 axios 路径 | 后端 |
| --- | --- |
| `GET/POST/PATCH/DELETE /email/account` | 单账号 CRUD |
| `POST /email/account/test` | 连接测试 |
| `GET /email/folders` | 文件夹 |
| `GET /email/messages` | 列表（folder_type / folder_path / search / is_read …） |
| `GET/PATCH/DELETE /email/messages/:id` | 详情、更新标记、删除 |
| `POST /email/messages/send` | 发信 |
| `POST /email/messages/actions` | 批量操作（预留） |
| `POST /email/sync`、`GET /email/sync/status` | 同步 |
| `GET /email/attachments/:id` | 附件流（下载需 Bearer） |

---

## 六、非目标（Phase 1）

- 不恢复 `frontend/app/api/email/*` mock。
- 不在此模块新增第二套 Copilot Provider。
- 全文搜索、IMAP IDLE、会话线程等见 PRD Phase 2+。
