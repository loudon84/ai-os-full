---
name: RuntimeWorkspacePanel 文件树与预览
overview: 将 RuntimeWorkspacePanel 从占位卡片升级为基于 session.workspace 的可用文件面板：通过 runtime BFF 透传 hermes-webui 的 list/file/file-raw/file-save/file-create/file-rename/file-delete/file-create-dir 接口，实现当前目录列表 + 面包屑导航 + 新建/重命名/删除 + Dialog 文件预览/编辑（文本/Markdown/图片）。
todos:
  - id: bff-binary
    content: BFF 路由新增 proxyBinary 分支，file/raw 二进制透传；完善 mapRuntimePathToWebuiApi 显式映射 list/file/file-raw/file-save/file-create/file-rename/file-delete/file-create-dir/workspaces
    status: completed
  - id: types
    content: runtime/types.ts 追加 RuntimeFsEntry 与 RuntimeFileContent 类型
    status: completed
  - id: hook-workspace
    content: 新增 use-runtime-workspace.ts 封装 list 查询 + 五类 mutation + readTextFile + buildRawUrl + currentDir 导航
    status: completed
  - id: panel
    content: 重写 RuntimeWorkspacePanel：header + 面包屑/返回上级 + 列表 + 行级 dropdown（Rename/Delete/Open）+ New File / New Folder / Refresh + 空态/错误态
    status: completed
  - id: prompt-dialog
    content: 新增 RuntimeFsPromptDialog 用于 New File / New Folder / Rename 的命名输入
    status: completed
  - id: preview-dialog
    content: 新增 RuntimeFilePreviewDialog：扩展名分流（图片用 raw url、md 用 RuntimeMarkdown + 编辑模式、其他文本 textarea），Ctrl/Cmd+S 保存
    status: completed
  - id: verify
    content: 本地启动 hermes-webui 后端，验证列表/新建/重命名/删除/文本保存/图片预览的端到端链路
    status: completed
isProject: false
---

## 范围

- 文件树：当前目录单层列表 + 面包屑 + 父目录返回（对齐 `hermes-webui` 的 `S.currentDir` 模式），列表行显示 name/size/类型图标。
- 预览/编辑 Dialog：Markdown 渲染、纯文本可编辑保存、图片通过 `/file/raw` 直出。
- 基本文件操作：New File、New Folder、Rename、Delete、Save。
- 刷新按钮、session 未选中时的空态、请求错误的 toast。
- 不做：workspace 多空间切换（session 已绑定 workspace）、拖拽上传（上传走已有 `/api/hermes/runtime/upload`，后续再接）、树形多级展开缓存（保持 320px 宽度下可读）。

## 关键文件与改动

### 1. BFF 增加二进制透传分支（图片预览必需）

[app/api/hermes/runtime/[...path]/route.ts](app/api/hermes/runtime/%5B...path%5D/route.ts) 的 `GET` 现在对所有非 SSE 路径走 `proxyJson`，用 `res.text()` 会破坏图片字节流。新增 `proxyBinary`，并在路径为 `file/raw` 时改走该分支：

```ts
async function proxyBinary(req: NextRequest, upstreamUrl: string) {
  const upstream = await fetch(upstreamUrl, {
    method: "GET",
    headers: { ...pickPassthroughHeaders(req) },
    cache: "no-store",
  });
  const headers = new Headers();
  for (const key of ["content-type", "content-length", "content-disposition", "cache-control"]) {
    const v = upstream.headers.get(key);
    if (v) headers.set(key, v);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}
```

`GET` 主体：

```ts
const key = path.join("/");
if (key === "chat/stream") return proxySse(request, url.toString());
if (key === "file/raw") return proxyBinary(request, url.toString());
return proxyJson(request, url.toString());
```

`mapRuntimePathToWebuiApi` 的显式表补上 `list / file / file/raw / file/save / file/create / file/rename / file/delete / file/create-dir / workspaces`，避免依赖 fallback（可读性）。

### 2. 新增 workspace 类型

[modules/hermes/runtime/types.ts](modules/hermes/runtime/types.ts) 追加：

```ts
export type RuntimeFsEntry = {
  name: string;
  path: string;
  type: "dir" | "file";
  size: number | null;
};

export type RuntimeFileContent = {
  path: string;
  content: string;
  size: number;
  lines: number;
};
```

### 3. 新增数据 hook（封装请求 + 派发刷新）

新文件 [modules/hermes/runtime/hooks/use-runtime-workspace.ts](modules/hermes/runtime/hooks/use-runtime-workspace.ts)：

- 入参：`sessionId: string | null`，内部维护 `currentDir`（默认 `"."`）。
- `useQuery(["runtime-fs", sessionId, currentDir])` 拉 `/api/hermes/runtime/list?session_id=&path=`。
- `useMutation` 封装：`createFile(path,content?)`、`createDir(path)`、`rename(path,newName)`、`remove(path)`、`saveFile(path,content)`，全部 `POST /api/hermes/runtime/file/*`，成功后 `invalidate(["runtime-fs",sessionId])`。
- 暴露 `readTextFile(path)` → `GET /api/hermes/runtime/file?...`（直接用 `queryClient.fetchQuery` 或一次性 `fetch`）。
- 暴露 `buildRawUrl(path)` → `/api/hermes/runtime/file/raw?session_id=&path=`，用作 `<img src>`。
- 暴露 `navigate(dir)` / `goUp()`，`goUp` 使用 POSIX 语义（`.`、`foo/bar` → `foo`）。

Hook 通过 `selector` 从 `useRuntimeSessionStore` 拿 `currentSession?.session_id`；调用方也可显式传入。

### 4. 重构面板组件

[modules/hermes/runtime/components/RuntimeWorkspacePanel.tsx](modules/hermes/runtime/components/RuntimeWorkspacePanel.tsx) 重写为：

- 头部：标题 `Workspace` + `session.workspace` 小字（`truncate` + `title`） + 操作按钮 `New File / New Folder / Refresh`。
- 面包屑条：`./foo/bar` 可点击跳段；左侧一个 `↑` 返回父目录，根目录禁用。
- 列表：`ScrollArea` + 行 item：文件夹点击进入；文件点击打开预览 Dialog。每行右侧 `...` dropdown: Rename / Delete；文件多一条 Open。
- 空态：`sessionId == null` → "请选择或创建会话以查看 workspace"；`entries.length == 0` → "空目录"。
- 错误态：在标题栏下方一行红字 + 重试按钮。

在 sticky 情况下，通过 `onNewFile`/`onNewFolder` 打开简单的 Prompt 组件（复用 `shadcn/ui` 的 `Dialog` + `Input`；或直接 `window.prompt` 第一版，保持最小实现）——**优先 Dialog 版保持风格统一**，新建小组件 `RuntimeFsPromptDialog`：两个 props `title`、`defaultValue`、`onSubmit`。

### 5. 新增文件预览 Dialog

新文件 [modules/hermes/runtime/components/RuntimeFilePreviewDialog.tsx](modules/hermes/runtime/components/RuntimeFilePreviewDialog.tsx)：

- props：`open`、`onOpenChange`、`sessionId`、`path`、`onSaved?`。
- 根据扩展名分流（与 `hermes-webui` 前端一致的分类）：
  - 图片（png/jpg/jpeg/gif/webp/svg/bmp/ico）：`<img src={buildRawUrl(path)} />`，只读。
  - Markdown（md/markdown）：默认渲染模式用已有的 [RuntimeMarkdown](modules/hermes/runtime/components/RuntimeMarkdown.tsx)；按钮切换到 `textarea` 源码编辑，`Save` 调 `saveFile`。
  - 其余文本：`textarea` 直接编辑 + `Save`。
- 内部用 `useQuery(["runtime-file", sessionId, path])` 读取文本；`onSave` 调 `saveFile`，成功后 `invalidate` 自身，并回调通知面板。
- 保存按钮在无变更时 disabled；`Esc` 关闭；`Ctrl/Cmd+S` 触发保存。

### 6. 接线

[modules/hermes/runtime/pages/RuntimeChatPage.tsx](modules/hermes/runtime/pages/RuntimeChatPage.tsx) 只需保留现有 `showRightPanel` 逻辑，`<RuntimeWorkspacePanel />` 自身从 session store 拿 `session_id`，无需新传 props。

### 7. UI 依赖检查（已具备，无需新装）

- `@tanstack/react-query`、`zustand`：已使用。
- `shadcn/ui` 的 `dialog`、`dropdown-menu`、`input`、`button`、`scroll-area`、`card`：确认已安装；若 `dialog`/`dropdown-menu` 未安装则用 `npx shadcn@latest add dialog dropdown-menu` 补齐（在实现阶段现场检查）。

## 边界 & 风险

- **session_id 必填**：所有 fs 接口都会 400 on missing session_id；面板会在无会话时全部禁用，避免误请求。
- **二进制 MIME**：`file/raw` 现在必须走 `proxyBinary`，否则所有图片都显示损坏——计划已修复。
- **路径安全**：后端 `safe_resolve_ws` 已拒绝越界；前端 `goUp/navigate` 不需要额外校验，但会过滤 `..` 片段避免用户直接构造。
- **编码**：文本保存固定 UTF-8，与后端 `target.write_text(..., "utf-8")` 一致。
- **大文件**：`/api/file` 超过 `MAX_FILE_BYTES` 时后端返回 400；Dialog 捕获并提示"文件过大，不支持预览"。
- **Toast**：使用项目现有 toast（若不存在就先用 `console.error` + Dialog 内错误条带兜底，不新增依赖）。

## 测试清单（实现完成后人工验证）

- 未选会话时面板空态正确。
- 列表加载显示 workspace 根目录；点击目录进入、面包屑回跳、`↑` 返回父级。
- 新建文件/文件夹在列表中立即出现；重名时后端 400 被提示。
- 重命名后在列表中刷新；Dialog 保存后 size/lines 反映变化。
- 图片文件在 Dialog 中可显示（验证 BFF `proxyBinary` 分支）。
- 删除后行消失；取消按钮无副作用。