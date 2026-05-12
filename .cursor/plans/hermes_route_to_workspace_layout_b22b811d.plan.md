---
name: Hermes route to workspace layout
overview: 将 `app/[lang]/(dashboard)/hermes/**` 迁移到 `app/[lang]/hermes/**`，并让所有 Hermes 页面使用 `WorkspaceLayoutProvider`（仅 Header + flex-1 主区 + 全局 Copilot），不再继承 Dashboard Sidebar/Footer 壳层；旧文件删除且不做 redirect。
todos:
  - id: add-hermes-standalone-layout
    content: 新增 app/[lang]/hermes/layout.tsx，使用 WorkspaceLayoutProvider + auth + i18n
    status: completed
  - id: move-hermes-routes
    content: 平移 hermes 路由树到 app/[lang]/hermes/**（page.tsx 与 dev 子树）
    status: completed
  - id: remove-old-hermes-routes
    content: 删除 app/[lang]/(dashboard)/hermes/** 旧目录
    status: completed
  - id: verify-hermes-pages
    content: 本地验证 /hermes 各子页在新壳层下可用且自适应高度
    status: completed
  - id: doc-sync-hermes
    content: 按规则更新 specs/pages.md、specs/layout-structure.md、docs/INDEX.md、AGENTS.md
    status: completed
isProject: false
---

# Hermes 迁移到 WorkspaceLayoutProvider

## 目标

- **路由文件从** `[frontend/app/[lang]/(dashboard)/hermes/](frontend/app/[lang]/(dashboard)/hermes/)` **迁移到** `[frontend/app/[lang]/hermes/](frontend/app/[lang]/hermes/)`（含 `sessions/skills/settings/runtime/dev/*`）。
- Hermes 的 URL 仍保持 **`/[lang]/hermes/*`**（因为 `(dashboard)` 路由组不出现在 URL），但 **layout 壳层改为** `WorkspaceLayoutProvider`：只保留 Header + `flex-1 min-h-0` 主内容区 + 全局 CopilotSidebar。
- **不保留旧实现文件**，也不做 redirect。

## Layout Decision（迁移后的页面壳层）

- **route type**: standalone route（`app/[lang]/hermes/*`，与 `(dashboard)` 平级）
- **selected page template**: Custom（复用 `WorkspaceLayoutProvider` 的 flex 列壳层，不使用 Dashboard 模板）
- **shell inheritance**:
  - Header: ✅ 继承（复用 `components/partials/header`）
  - Sidebar: ❌ 不继承
  - Footer: ❌ 不继承
  - ThemeCustomize: ❌ 不继承（保持 RootLayout 的主题系统）
  - Auth protection: ✅ 继承（在 `app/[lang]/hermes/layout.tsx` 做 server redirect）
  - i18n: ✅ 继承（沿用 `getDictionary(lang)`，传入 Header）
  - GlobalCopilotProvider/Sidebar: ✅ 继承（已在 `app/[lang]/layout.tsx` 全局挂载）
- **layout files**: 
  - `app/[lang]/hermes/layout.tsx` 必须新增（负责 auth + trans + provider）
  - 子页 `page.tsx` 平移即可
- **Copilot behavior**: 只使用全局 Copilot Sidebar（不新建 provider）
- **forbidden changes**: 不改 `app/[lang]/layout.tsx`、不改 `app/[lang]/(dashboard)/layout.tsx`、不改 `provider/*` 既有文件、不改 `components/ui/*`

## 现状盘点（将被平移的文件）

来自 `[frontend/app/[lang]/(dashboard)/hermes/](frontend/app/[lang]/(dashboard)/hermes/)`：
- `layout.tsx`（仅 metadata + fragment）
- `page.tsx` → `HermesDashboardPage`
- `runtime/page.tsx` → `RuntimeChatPage`
- `sessions/page.tsx` → `HermesSessionsPage`
- `skills/page.tsx` → `HermesSkillsPage`
- `settings/page.tsx` → `HermesSettingsPage`
- `dev/layout.tsx`（DEV only + `HermesModuleShell`）
- `dev/tool-ui/*/page.tsx`（预览页面）

## 实施步骤

1. **新增** `app/[lang]/hermes/layout.tsx`
   - 参考 `[frontend/app/[lang]/workspace/layout.tsx](frontend/app/[lang]/workspace/layout.tsx)`
   - `getServerSession(authOptions)` 未登录则 `redirect("/auth/login")`
   - `getDictionary(lang)` 获取 `trans`
   - `return <WorkspaceLayoutProvider trans={trans}>{children}</WorkspaceLayoutProvider>`

2. **创建新目录并平移 pages** 到 `app/[lang]/hermes/**`
   - 逐个复制原 `page.tsx` 内容（仅 import 路径与组件名保持一致）
   - `dev/*` 子树保持原逻辑（production 下 `notFound()`）

3. **删除旧目录** `app/[lang]/(dashboard)/hermes/**`
   - 因你选择不做兼容 redirect，旧文件应清理避免重复路由与维护负担。

4. **验证点（本地）**
   - `pnpm -C frontend dev` 后访问：
     - `/{lang}/hermes`
     - `/{lang}/hermes/sessions`
     - `/{lang}/hermes/skills`
     - `/{lang}/hermes/settings`
     - `/{lang}/hermes/runtime`
   - 确认：页面不再显示 Dashboard Sidebar/Footer；主内容区随窗口高度自适应（无 `.app-height` 依赖）；CopilotSidebar 打开时右侧不遮挡内容（`WorkspaceLayoutProvider` 的 `marginRight` 生效）。

5. **文档同步（按规则）**
   - 更新 `[frontend/specs/pages.md](frontend/specs/pages.md)`：把 Hermes 路由从 “Dashboard 页面” 移到 standalone，并标注新的 layout。
   - 更新 `[frontend/specs/layout-structure.md](frontend/specs/layout-structure.md)`：在全景图里补充 `app/[lang]/hermes/layout.tsx`（参考你们已补的 `workspace` 条目）。
   - 更新 `[docs/INDEX.md](docs/INDEX.md)` 与根级 `[AGENTS.md](AGENTS.md)` 第三节地图：增加/修正 hermes 路由归属变化（从 dashboard 壳迁至 standalone）。

## 风险与注意

- **URL 不会改变**：因为 `(dashboard)` 不在 URL 中，迁移前后仍是 `/{lang}/hermes/*`。
- Hermes 页面若隐式依赖 Sidebar 留白或 dashboard 的 `content-wrapper` margin，迁移后可能出现内容变宽/贴边，需要在 Hermes 页面自身用容器 `max-w-*` 或 padding 处理（优先局部改 `modules/hermes/*`，不动全局壳）。
