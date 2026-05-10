# Documents Module

本模块提供 AI OS Portal 内置文档系统的 MVP：以 Univer Sheet 作为在线表格查看/编辑内核。

## 运行方式（MVP）

### 1) 仅前端 mock（快速验证）

- 默认走真实接口；需要 mock 时显式设置 `NEXT_PUBLIC_DOCUMENT_USE_MOCK=true`
- 打开 `portal` 后访问：
  - `/documents`
  - `/documents/:documentId`

### 2) 连接真实后端（Phase 5）

在 `portal/.env.local` 增加：

```env
# 可选：不设置也默认走真实接口
NEXT_PUBLIC_DOCUMENT_USE_MOCK=false
NEXT_PUBLIC_API_URL=http://localhost:8001/api
```

然后：

```bash
pnpm dev
```

## 手工验收脚本

- **列表页**：打开 `/documents`，可看到文档列表；可新建文档；点击行可进入详情页
- **编辑页**：打开 `/documents/:documentId`，Univer 可渲染并可编辑单元格
- **保存**：编辑后点击保存，保存成功后刷新页面，内容仍存在（走真实后端时）
- **只读权限**：当后端返回 `current_user_permission=view` 时保存按钮禁用（走真实后端时）
- **版本冲突**：并发保存导致 409 时，页面显示“版本冲突”提示，点击“刷新文档”可重新加载

