# 《SPEC：AI OS Portal 独立文档模块 + Univer Sheet 内核》

## 1. Feature Scope

### 1.1 目标

在 `ai-os-portal` 中新增独立文档模块：

```text
/documents
/documents/:documentId
```

首期只实现：

| 能力          | 范围                                   |
| ----------- | ------------------------------------ |
| 文档列表        | mock / API 双模式                       |
| 表格文档        | Univer Sheet                         |
| 编辑          | 单用户编辑                                |
| 保存          | 保存 workbook snapshot JSON            |
| 版本          | 保留 version 字段                        |
| Provider 抽象 | 支持未来 WeCom / OnlyOffice / Univer Pro |
| Facade 集成   | 仅保留 document reference，不直连 Agent     |

---

## 2. Non-Goals

```text
不做 XLSX 导入导出
不做多人协同
不做 Word 编辑
不做 Markdown 编辑
不接企业微信文档 API
不接 OnlyOffice
不接 ai-os-facade task API
不修改全局 Layout / Provider
不把 Univer API 暴露到页面层
```

---

## 3. Architecture Rule

```text
Page
  → Document Hooks
  → Document API Client
  → SpreadsheetEngineAdapter
  → UniverSpreadsheetAdapter
  → Univer Runtime
```

强制约束：

```text
pages/** 不允许 import @univerjs/*
components/** 不允许直接调用 univerAPI
只有 adapters/UniverSpreadsheetAdapter.ts 可 import @univerjs/*
```

---

## 4. Directory Spec

```text
src/modules/documents/
├── SPEC.md
├── api/
│   ├── documentTypes.ts
│   ├── documentApi.ts
│   └── documentMockApi.ts
├── adapters/
│   ├── SpreadsheetEngineAdapter.ts
│   └── UniverSpreadsheetAdapter.ts
├── components/
│   ├── DocumentModuleShell.tsx
│   ├── DocumentToolbar.tsx
│   ├── DocumentStatusBadge.tsx
│   └── DocumentCreateDialog.tsx
├── hooks/
│   ├── useDocuments.ts
│   ├── useDocumentDetail.ts
│   └── useDocumentSave.ts
├── mocks/
│   ├── mockDocuments.ts
│   └── mockWorkbook.ts
├── pages/
│   ├── DocumentListPage.tsx
│   └── DocumentDetailPage.tsx
├── spreadsheet/
│   ├── UniverSheetHost.tsx
│   └── UniverLoading.tsx
└── utils/
    └── debounce.ts
```

---

## 5. Data Contract

```ts
export type DocumentType = "spreadsheet";
export type DocumentEngine = "univer-sheet";
export type DocumentStatus = "draft" | "active" | "archived";

export interface DocumentMeta {
  id: string;
  title: string;
  type: DocumentType;
  engine: DocumentEngine;
  status: DocumentStatus;
  workspaceId: string;
  ownerId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  provider: "local" | "wecom" | "onlyoffice";
  externalId?: string;
  externalUrl?: string;
}

export interface UniverWorkbookSnapshot {
  id: string;
  name: string;
  data: Record<string, unknown>;
}

export interface SpreadsheetDocument extends DocumentMeta {
  snapshot: UniverWorkbookSnapshot;
}

export interface UpdateDocumentRequest {
  version: number;
  snapshot: UniverWorkbookSnapshot;
}
```

---

## 6. Engine Adapter Contract

```ts
export interface SpreadsheetEngineMountOptions {
  container: HTMLElement;
  readonly?: boolean;
  initialSnapshot?: UniverWorkbookSnapshot;
  onDirtyChange?: (dirty: boolean) => void;
}

export interface SpreadsheetEngineInstance {
  getSnapshot(): UniverWorkbookSnapshot;
  setReadonly(readonly: boolean): void;
  dispose(): void;
}

export interface SpreadsheetEngineAdapter {
  engine: "univer-sheet";
  mount(options: SpreadsheetEngineMountOptions): SpreadsheetEngineInstance;
}
```

---

## 7. API Contract

```ts
export interface DocumentApi {
  list(params?: {
    workspaceId?: string;
    keyword?: string;
  }): Promise<DocumentMeta[]>;

  get(documentId: string): Promise<SpreadsheetDocument>;

  create(input: {
    title: string;
    workspaceId: string;
  }): Promise<DocumentMeta>;

  update(
    documentId: string,
    input: UpdateDocumentRequest
  ): Promise<{
    documentId: string;
    version: number;
    updatedAt: string;
  }>;

  remove(documentId: string): Promise<void>;
}
```

---

## 8. Page Behavior Spec

### `/documents`

必须实现：

```text
显示文档列表
支持创建 spreadsheet 文档
点击文档进入 /documents/:documentId
空数据展示 Empty State
加载失败展示 Error State
```

### `/documents/:documentId`

必须实现：

```text
加载文档详情
挂载 UniverSheetHost
支持单元格编辑
点击保存时调用 engine.getSnapshot()
保存成功后 version +1
页面卸载时 dispose()
加载失败允许重试
```

---

## 9. State Machine

```text
idle
 → loading
 → ready
 → dirty
 → saving
 → saved
 → dirty
 → saving
 → error
```

保存冲突：

```text
如果 API 返回 409 version_conflict：
- 不覆盖本地 snapshot
- 显示“版本冲突，请刷新后重试”
- 保留当前编辑状态
```

---

## 10. Cursor Implementation Order

```text
Step 1: 安装依赖
pnpm add @univerjs/presets @univerjs/preset-sheets-core

Step 2: 创建 modules/documents 目录树

Step 3: 实现 api/documentTypes.ts

Step 4: 实现 mocks/mockWorkbook.ts 与 mockDocuments.ts

Step 5: 实现 documentMockApi.ts 与 documentApi.ts

Step 6: 实现 SpreadsheetEngineAdapter.ts

Step 7: 实现 UniverSpreadsheetAdapter.ts

Step 8: 实现 UniverSheetHost.tsx

Step 9: 实现 hooks

Step 10: 实现 DocumentListPage.tsx

Step 11: 实现 DocumentDetailPage.tsx

Step 12: 挂载路由

Step 13: 本地验证
```

---

## 11. DoD

| 验收项       | 标准                                     |
| --------- | -------------------------------------- |
| 模块独立      | 所有新增代码在 `src/modules/documents/**`     |
| 路由可访问     | `/documents`、`/documents/:id` 正常打开     |
| Univer 隔离 | 只有 Adapter 文件 import Univer            |
| 编辑可用      | 单元格可输入                                 |
| 保存可用      | 能保存 snapshot JSON                      |
| 生命周期正确    | 页面卸载执行 dispose                         |
| 类型完整      | 无 `any` 泄漏到页面层                         |
| 可替换       | 页面只依赖 `SpreadsheetEngineAdapter`       |
| 不污染全局     | 不改全局 Layout / Provider                 |
| 未来兼容      | `provider/externalId/externalUrl` 字段保留 |

---

## 12. Cursor Prompt

```md
# Feature: AI OS Portal Documents Module with Univer Sheet Engine

## Goal
新增独立 documents 模块，将 Univer 作为 spreadsheet 查看/编辑内核。模块必须可替换、可迁移、可被未来 ai-os-facade 通过 document reference 引用。

## Scope
只实现 spreadsheet 文档：
- 文档列表
- 文档详情
- Univer Sheet 编辑
- 保存 workbook snapshot JSON
- mock API
- Adapter 抽象

## Non-Goals
- 不实现 XLSX 导入导出
- 不实现多人协同
- 不接企业微信文档
- 不接 OnlyOffice
- 不接 ai-os-facade
- 不修改全局 Provider
- 不修改全局 Layout

## Hard Rules
1. 所有新增代码必须放在 `src/modules/documents/**`
2. 只有 `UniverSpreadsheetAdapter.ts` 可以 import `@univerjs/*`
3. 页面组件不得直接访问 `univerAPI`
4. 页面只能依赖 `SpreadsheetEngineAdapter`
5. 保存格式为 `UniverWorkbookSnapshot`
6. 必须在组件卸载时 dispose Univer 实例
7. API 先使用 mock，但接口必须可替换为真实后端
8. 保留 provider 字段：local/wecom/onlyoffice

## Required Files
按 SPEC.md 中 Directory Spec 创建。

## Acceptance
- `/documents` 显示 mock 文档列表
- 点击文档进入编辑页
- Univer 正常渲染
- 单元格可编辑
- 点击保存后 snapshot 保存成功
- 页面卸载时 dispose
- TypeScript 无错误
```
