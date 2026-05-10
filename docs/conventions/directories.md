# 目录归属规则（文档与代码）

> 本文件规定 **文件/目录放在哪里**。Agent 在新建任何文件前应当先对照本文件。
> 原则：**壳层（app/components）不变，业务落 modules/，文档分类清晰**。

---

## 一、一图看懂（最高频判断）

```
我要新建一个…
├─ 路由页面（URL 暴露出去）    → app/[lang]/(dashboard)/<path>/page.tsx
├─ API 端点                    → app/api/<resource>/route.ts
├─ 一个业务模块下的组件        → modules/<domain>/components/
├─ 一个业务模块下的页面模板    → modules/<domain>/pages/
├─ 一个业务模块下的 hook       → modules/<domain>/hooks/
├─ 一个业务模块下的 store      → modules/<domain>/stores/
├─ 一个业务模块下的 mock/fixture → modules/<domain>/mocks/ 或 tool-ui/fixtures/
├─ Shadcn UI 原子              → components/ui/  ← 仅扩展官方 shadcn 组件时
├─ 跨模块通用业务组件          → components/<feature>/
├─ 通用 hook / util / 类型     → hooks/ / lib/ / lib/type.ts
├─ Server Action              → action/<domain>-action.ts 或 modules/<domain>/services/
├─ Provider                    → provider/
├─ 配置                        → config/
├─ 国际化字典                  → app/dictionaries/<locale>.json
├─ Story                       → stories/（镜像目标路径）
├─ 一份 PRD                    → docs/prd/
├─ 一份代码结构规格            → specs/
└─ 一份约定/规范                → docs/conventions/
```

---

## 二、代码目录归属

### 2.1 应用壳层（不可改职责）

| 目录 | 职责 | 允许的变更 |
|------|------|-----------|
| `app/[lang]/` | 路由与 i18n 入口 | 新增路由组/页面；**不改** `layout.tsx` 的 Provider 链 |
| `app/api/` | 服务端 REST / Route Handler | 新增业务资源 |
| `middleware.ts` | i18n 中间件 | 慎改 |
| `provider/` | 全局 Provider | 慎改；新 Provider 先评估是否必须全局 |
| `config/` | 站点/主题/菜单配置 | 新增配置项；不要在这里放业务逻辑 |
| `lib/` | 跨域通用工具 | 严格判定"跨域通用"再放这里 |
| `hooks/` | 跨域通用 Hook | 同上 |
| `store/` | 跨域全局状态（主题/侧边栏等） | 不放单一模块状态（应进 `modules/<domain>/stores/`） |

### 2.2 UI 层

| 目录 | 职责 | 规则 |
|------|------|------|
| `components/ui/` | Shadcn 原子组件 | **不魔改**现有文件；新增仅限 shadcn-cli 风格的原子 |
| `components/<feature>/` | 通用业务组件（如 `auth/`、`files/`、`task-board/`、`landing-page/`） | 跨多个 modules 使用的业务组件放这里 |
| `components/partials/` | 布局局部（header/sidebar/footer/customizer） | 慎改 |
| `components/svg/` | 项目 SVG 图标 | 新增图标放这里，统一由 `svg/index.ts` 导出 |

### 2.3 业务模块（`modules/<domain>/`）

每个业务 domain 一个子目录，目录结构模板：

```
modules/<domain>/
├── index.ts                 # 对外导出入口（barrel，仅此一个）
├── types/                   # 领域类型 / DTO / 契约
├── components/              # 领域组件（展示层）
│   ├── shared/              # 模块内共享子件
│   └── <feature>/           # 按功能分组（可选）
├── pages/                   # 页面级组件（由 app/ 下 page.tsx 引用）
├── hooks/                   # 领域 Hook
├── stores/                  # 领域 Zustand Store
├── services/ 或 api/        # 数据访问 / Server Action / RPC
├── mocks/                   # Mock 数据（非 schema 驱动的）
├── dev/                     # 开发调试（preview-registry / story-seeds 等）
└── tests/                   # 单测 / 集成测试
```

> 当前已存在的 domain：`hermes`、`finance`、`risk`、`forecast`、`copilotkit`。
> 新域请参考 `hermes` 的成熟结构。

### 2.4 Hermes 特殊目录

`modules/hermes/` 的额外子目录（与上面通用模板并存）：

| 子目录 | 作用 |
|--------|------|
| `copilot/` | CopilotKit 接入层：agent-router、streaming-agent、frontend-tools、events-mapper、interrupt-protocol、types |
| `tool-ui/` | AI 工具结果可视化层：`adapters/` / `cards/` / `mappers/` / `schemas/` / `mocks/` / `fixtures/` / `registry.ts` / `types.ts` |
| `dev/` | Dev Preview 工作台：`preview-registry.ts` / `story-seeds.ts` / `schema-resolver.ts` |
| `components/copilot/` | AI 对话 UI 壳层（panel/banner/interrupt-form 等） |
| `components/dashboard/` | Dashboard UI（metrics/clickable-card 等） |
| `components/dev-preview/` | 对应 `dev/` 的 UI |

### 2.5 其他

| 目录 | 职责 |
|------|------|
| `action/` | Next.js Server Action（跨模块共享或旧模式） |
| `ai/` | 旧版 AI Copilot Provider/Registry（迁移中，新的放 `modules/copilotkit/` 或 `modules/hermes/copilot/`） |
| `tools/ast-grep/` | 代码扫描工具 |
| `scripts/` | 构建/生成脚本 |
| `generated/` | 自动生成的产物（**不要手改**） |
| `public/` | 静态资源 |
| `stories/` | Storybook 故事（镜像源文件路径） |

---

## 三、文档目录归属

### 3.1 四大分区（唯一正确路径）

| 分区 | 路径 | 内容定义 |
|------|------|----------|
| **Agent 手册** | `AGENTS.md`（根） | Agent 读取策略、硬约束 |
| **索引** | `docs/INDEX.md` + `specs/INDEX.md` | 文档/代码地图 |
| **规约** | `docs/conventions/*.md` | 本仓库的**做事规则** |
| **产品 PRD** | `docs/prd/*.md` | 需求/方案/验收 |
| **代码规格** | `specs/*.md` | **现有**代码结构的描述性快照 |

### 3.2 判断表：一份新文档该放哪里？

| 问法 | 放哪 |
|------|------|
| "我要规定以后怎么做" | `docs/conventions/` |
| "我要描述要做什么 / 为什么做" | `docs/prd/` |
| "我要描述现在代码长什么样" | `specs/` |
| "我要告诉 Agent 怎么读这些文档" | `AGENTS.md` 或索引 |
| "我要给外部开发者入门" | `README.md` |

### 3.3 PRD 文件命名

```
docs/prd/<domain>_<purpose>.md
docs/prd/<domain>_<phaseN>.md       # 分阶段 PRD
示例：
  docs/prd/finance_module.md
  docs/prd/integrate_copilot.md
  docs/prd/hermes_dashboard_phase3.md
```

### 3.4 Specs 文件命名

```
specs/<subject>.md                   # 面向主题（kebab-case）
示例：
  specs/project-structure.md
  specs/components.md
  specs/layout-structure.md
  specs/pages.md
  specs/INDEX.md                     # 索引用全大写 INDEX
```

### 3.5 Conventions 文件命名

```
docs/conventions/<topic>.md          # kebab-case，单一主题
目前：
  docs/conventions/naming.md
  docs/conventions/directories.md
```

新增规约必须：
1. 单一主题（不要把命名+目录+分支写进一个文件）。
2. 在 `docs/INDEX.md` 的「规约」表里登记。
3. 在 `AGENTS.md` 的「文档目录一句话地图」里加一行。

---

## 四、Story 归属（镜像规则）

Story 路径 = `stories/` + 去掉 `modules/` 前缀的源文件路径。

| 源文件 | Story 路径 |
|--------|-----------|
| `modules/hermes/components/copilot/hermes-tool-renderer.tsx` | `stories/modules/hermes/hermes-tool-renderer.stories.tsx` |
| `modules/finance/components/aging-table.tsx` | `stories/modules/hermes/finance/aging-table.stories.tsx` |
| `components/ui/button.tsx` | `stories/ui/button.stories.tsx` |
| `components/auth/login-form.tsx` | `stories/auth/login-form.stories.tsx` |

> 说明：目前 modules 下的 story 全部统一挂在 `stories/modules/hermes/...` 下（按 domain 分子目录）。保持此约定直到 storybook 导航需要调整时再重组。

---

## 五、Agent 行为规约（归属层面）

1. 先**就地扩展**已有目录，再考虑新建目录；新目录必须写明原因并在 PR 描述中说明。
2. 不确定归属时：读本文件 → 读 `specs/INDEX.md` → 看最相似的已有文件 → 仍然不确定就**询问用户**。
3. **禁止**把 PRD/规约/代码规格混写进同一个 md。
4. **禁止**在 `components/ui/` 下新建业务组件。
5. **禁止**在 `app/[lang]/(dashboard)/<page>/` 下写大量业务逻辑；页面文件应当是轻壳，调用 `modules/<domain>/pages/*` 或 `modules/<domain>/components/*`。
6. 新增 domain 模块前，先检查是否可以作为已有 domain 的子特性（比如 `forecast` 可能是 `finance` 的子域——视 PRD 决定）。

---

## 六、检查清单（提交前自检）

- [ ] 文件名符合 `naming.md`
- [ ] 文件位置符合本 `directories.md`
- [ ] 新增文档已在 `docs/INDEX.md` 登记
- [ ] 无改动 `app/[lang]/layout.tsx` 的 Provider 链（除非 PRD 明确授权）
- [ ] 无魔改 `components/ui/*`
- [ ] Story 路径镜像源文件路径
- [ ] 导入次序符合 `naming.md` 第四节
