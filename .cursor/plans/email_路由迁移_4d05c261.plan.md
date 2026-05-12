---
name: Email 路由迁移
overview: 将 email 路由从 (dashboard) 路由组迁移到顶级 app/[lang]/email，使用 WorkspaceLayoutProvider 作为壳层，删除旧文件并同步文档。
todos:
  - id: add-email-standalone-layout
    content: 新增 app/[lang]/email/layout.tsx，使用 WorkspaceLayoutProvider + auth + i18n
    status: completed
  - id: move-email-routes
    content: 平移 email 路由树到 app/[lang]/email/**（page.tsx + settings/page.tsx），去除 app-height 依赖
    status: completed
  - id: remove-old-email-routes
    content: 删除 app/[lang]/(dashboard)/email/** 旧目录
    status: completed
  - id: doc-sync-email
    content: 更新 specs/pages.md、specs/INDEX.md、specs/layout-structure.md、docs/INDEX.md、AGENTS.md 中的 email 路由引用
    status: completed
isProject: false
---

# Email 路由迁移到 WorkspaceLayoutProvider

## 迁移策略

与已完成的 Hermes 迁移完全同构：新建 `app/[lang]/email/` 路由组，挂载 `WorkspaceLayoutProvider`，平移页面文件，删除旧目录。

## 当前路由树

```
app/[lang]/(dashboard)/email/
  page.tsx            -> EmailWorkspacePage
  settings/page.tsx   -> EmailSettingsRoutePage
```

## 目标路由树

```
app/[lang]/email/
  layout.tsx           -> WorkspaceLayoutProvider (新建，复制 hermes/layout.tsx 模板)
  page.tsx             -> EmailWorkspacePage (平移)
  settings/page.tsx    -> EmailSettingsRoutePage (平移)
```

## 步骤

### 1. 新建 layout.tsx

复制 [frontend/app/[lang]/hermes/layout.tsx](frontend/app/[lang]/hermes/layout.tsx) 到 `frontend/app/[lang]/email/layout.tsx`，内容完全一致（`WorkspaceLayoutProvider` + auth + i18n）。

### 2. 平移页面文件

- 将 [frontend/app/[lang]/(dashboard)/email/page.tsx](frontend/app/[lang]/(dashboard)/email/page.tsx) 内容复制到 `frontend/app/[lang]/email/page.tsx`

- 将 [frontend/app/[lang]/(dashboard)/email/settings/page.tsx](frontend/app/[lang]/(dashboard)/email/settings/page.tsx) 内容复制到 `frontend/app/[lang]/email/settings/page.tsx`

- **注意**：settings/page.tsx 中使用了 `app-height` CSS 类（来自旧的 dashboard 壳层计算），迁移后应改为 flexbox 自适应（去掉 `app-height`，因为 WorkspaceLayoutProvider 已通过 `flex-1 min-h-0 overflow-auto` 提供高度）。

### 3. 删除旧目录

删除 `frontend/app/[lang]/(dashboard)/email/` 及其全部内容。

### 4. 更新代码内部引用

- [frontend/specs/INDEX.md](frontend/specs/INDEX.md) 第 189 行附近：`(dashboard)/email/settings/page.tsx` 路径更新为 `email/settings/page.tsx`

### 5. 文档同步

按 30-doc-sync-on-completion 规则更新：
- `frontend/specs/pages.md` — email 路由路径
- `frontend/specs/layout-structure.md` — email 壳层继承关系
- `docs/INDEX.md` — 如有 email 条目需更新路径
- `AGENTS.md` — 如有 email 路由引用需更新

## Layout Decision（强制前置确认）

1. **route type**: standalone route `app/[lang]/email/*`
2. **selected page template**: 沿用现有 EmailWorkspacePage / EmailSettingsPanel，无需新模板
3. **shell inheritance**: Header (是), Sidebar (否), Footer (否), ThemeCustomize (否), Auth (是, layout.tsx getServerSession), i18n (是), DirectionProvider (否), GlobalCopilotProvider (是, 通过 WorkspaceLayoutProvider 的 copilotOpen)
4. **layout files**: 需要 `email/layout.tsx`，page.tsx 各自独立
5. **Copilot behavior**: 全局 Copilot Sidebar，不新建 Provider
6. **forbidden changes**: 不修改 `app/[lang]/layout.tsx`、`(dashboard)/layout.tsx`、`provider/*`、`components/ui/*`
