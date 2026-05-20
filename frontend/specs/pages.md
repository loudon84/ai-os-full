# 页面清单与页面简述

> 本文档由全量代码扫描生成，列出 `app/[lang]/` 下所有页面路由及其功能简述。
> URL 中的 `[lang]` 为国际化动态段，支持 `en`/`bn`/`ar` 三种语言。
> 路由组 `(xxx)` 不影响 URL，仅用于组织 layout 共享。

---

## 一、根级页面

| 路由 | 文件 | 功能 |
|------|------|------|
| `/[lang]` | `app/[lang]/page.tsx` | 根页面，重定向到 dashboard |
| - | `app/[lang]/error.tsx` | 全局错误边界 |
| - | `app/[lang]/not-found.tsx` | 404 页面 |

---

## 二、认证页面 (`/[lang]/auth/`)

> 认证页面共享 `auth/layout.tsx`，无需登录即可访问。每种认证流程提供 5 个样式变体。

### 2.1 登录

| 路由 | 文件 | 功能 |
|------|------|------|
| `/[lang]/auth/login` | `auth/(login)/login/page.tsx` | 登录页变体 1 |
| `/[lang]/auth/login2` | `auth/(login)/login2/page.tsx` | 登录页变体 2（含 login-form.tsx） |
| `/[lang]/auth/login3` | `auth/(login)/login3/page.tsx` | 登录页变体 3 |
| `/[lang]/auth/login4` | `auth/(login)/login4/page.tsx` | 登录页变体 4 |
| `/[lang]/auth/login5` | `auth/(login)/login5/page.tsx` | 登录页变体 5 |

### 2.2 注册

| 路由 | 文件 | 功能 |
|------|------|------|
| `/[lang]/auth/register` | `auth/(register)/register/page.tsx` | 注册页变体 1（含 reg-form.tsx） |
| `/[lang]/auth/register2` ~ `register5` | 同上模式 | 注册页变体 2~5 |

### 2.3 忘记密码

| 路由 | 文件 | 功能 |
|------|------|------|
| `/[lang]/auth/forgot` | `auth/(forgot)/forgot/page.tsx` | 忘记密码变体 1（含 forgot-form.tsx） |
| `/[lang]/auth/forgot2` ~ `forgot5` | 同上模式 | 忘记密码变体 2~5 |

### 2.4 锁屏

| 路由 | 文件 | 功能 |
|------|------|------|
| `/[lang]/auth/lock` | `auth/(lock)/lock/page.tsx` | 锁屏变体 1（含 lock-form.tsx） |
| `/[lang]/auth/lock2` ~ `lock5` | 同上模式 | 锁屏变体 2~5 |

### 2.5 创建密码

| 路由 | 文件 | 功能 |
|------|------|------|
| `/[lang]/auth/create-password` | `auth/(password)/create-password/page.tsx` | 创建密码变体 1 |
| `/[lang]/auth/create-password2` ~ `5` | 同上模式 | 创建密码变体 2~5 |

### 2.6 验证码

| 路由 | 文件 | 功能 |
|------|------|------|
| `/[lang]/auth/verify` | `auth/(verify)/verify/page.tsx` | 验证码页变体 1 |
| `/[lang]/auth/verify2` ~ `verify5` | 同上模式 | 验证码页变体 2~5 |

---

## 三、错误页面 (`/[lang]/error-page/`)

| 路由 | 文件 | 功能 |
|------|------|------|
| `/[lang]/error-page/401` | `error-page/401/page.tsx` | 未授权错误页 |
| `/[lang]/error-page/403` | `error-page/403/page.tsx` | 禁止访问错误页 |
| `/[lang]/error-page/404` | `error-page/404/page.tsx` | 页面不存在 |
| `/[lang]/error-page/419` | `error-page/419/page.tsx` | 页面过期 |
| `/[lang]/error-page/429` | `error-page/429/page.tsx` | 请求过多 |
| `/[lang]/error-page/500` | `error-page/500/page.tsx` | 服务器内部错误 |
| `/[lang]/error-page/503` | `error-page/503/page.tsx` | 服务不可用 |

---

## 四、工具页面 (`/[lang]/utility/`)

| 路由 | 文件 | 功能 |
|------|------|------|
| `/[lang]/utility/comming-soon` | `utility/comming-soon/page.tsx` | 即将上线页面 |
| `/[lang]/utility/maintinance` | `utility/maintinance/page.tsx` | 维护中页面 |

---

## 四点五、个人工作台 (`/[lang]/workspace/`)

> 与 `(dashboard)` **同级**（不在 `(dashboard)/` 路由组内）。`workspace/layout.tsx` 使用 `WorkspaceLayoutProvider`：仅 Header + `flex-1 min-h-0` 主内容区（无 Sidebar/Footer）；全局 Copilot 仍由根 `app/[lang]/layout.tsx` 挂载。**需登录**。入口：顶栏头像下拉 →「个人工作台」。

| 路由 | 文件 | 功能 |
|------|------|------|
| `/[lang]/workspace` | `workspace/page.tsx` | Demo：挂载 `DocumentListPage`（与 dashboard `documents` 列表同源组件） |

---

## 四点六、Hermes（Standalone，`/[lang]/hermes/`）

> 与 `(dashboard)` **同级**（不在 `(dashboard)/` 路由组内）。`hermes/layout.tsx` 使用 `WorkspaceLayoutProvider`：仅 Header + `flex-1 min-h-0` 主内容区（无 Sidebar/Footer）；全局 Copilot 仍由根 `app/[lang]/layout.tsx` 挂载。**需登录**。

| 路由 | 文件 | 功能 |
|------|------|------|
| `/[lang]/hermes` | `hermes/page.tsx` | Hermes 仪表盘主页（`HermesDashboardPage`） |
| `/[lang]/hermes/sessions` | `hermes/sessions/page.tsx` | 会话列表（`HermesSessionsPage`） |
| `/[lang]/hermes/skills` | `hermes/skills/page.tsx` | Skills 列表（`HermesSkillsPage`） |
| `/[lang]/hermes/settings` | `hermes/settings/page.tsx` | Hermes 设置（`HermesSettingsPage`） |
| `/[lang]/hermes/runtime` | `hermes/runtime/page.tsx` | Runtime 对话工位（`RuntimeChatPage`） |
| `/[lang]/hermes/dev/*` | `hermes/dev/*` | Dev Tool UI 预览（生产环境 404） |

---

## 四点七、Email（Standalone，`/[lang]/email/`）

> 与 `(dashboard)` **同级**（不在 `(dashboard)/` 路由组内）。`email/layout.tsx` 使用 `WorkspaceLayoutProvider`：仅 Header + `flex-1 min-h-0` 主内容区（无 Sidebar/Footer）；全局 Copilot 仍由根 `app/[lang]/layout.tsx` 挂载。**需登录**。

| 路由 | 文件 | 功能 |
|------|------|------|
| `/[lang]/email` | `email/page.tsx` | 邮件工作区瘦壳页，挂载 `EmailWorkspacePage`：三栏可缩放（侧栏/主区/AI Panel）、Tiptap 撰写、回复转发与批量操作、Copilot 上下文与 Agent Actions；布局 cookie 为三列 `react-resizable-panels:layout` |
| `/[lang]/email/settings` | `email/settings/page.tsx` | 邮箱账号配置全页（与顶栏头像弹窗同源 `EmailSettingsPanel`） |

---

## 五、Dashboard 页面 (`/[lang]/(dashboard)/`)

> Dashboard 路由组共享 `(dashboard)/layout.tsx`，**需要登录**（未登录自动 redirect 到 `/auth/login`）。

### 5.1 首页/仪表盘 (`(home)/`)

| 路由 | 文件 | 功能 |
|------|------|------|
| `/[lang]/dashboard` | `(home)/dashboard/page.tsx` | 分析仪表盘首页，含国家地图/报告区域/Top10/用户设备/用户统计 |
| `/[lang]/ecommerce` | `(home)/ecommerce/page.tsx` | 电商仪表盘首页，含数据卡片/订单/Top国家/Top客户/收入图表 |
| `/[lang]/project` | `(home)/project/page.tsx` | 项目仪表盘首页，含活跃任务/逾期任务/项目预算/工作负载/贡献者 |

### 5.2 应用模块 (`(apps)/`)

| 路由 | 文件 | 功能 |
|------|------|------|
| `/[lang]/calendar` | `(apps)/calendar/page.tsx` | 日历应用，FullCalendar 集成，支持拖拽事件/事件面板 |
| `/[lang]/chat` | `(apps)/chat/page.tsx` | 聊天应用，联系人列表/消息/转发/置顶/联系人详情(屏蔽/静音/搜索) |
| `/[lang]/kanban` | `(apps)/kanban/page.tsx` | 看板应用，基于 @dnd-kit 拖拽排序 |
| `/[lang]/projects` | `(apps)/projects/page.tsx` | 项目列表，支持网格/列表视图切换，含 DataTable |
| `/[lang]/projects/[id]` | `(apps)/projects/[id]/` | 项目详情，含子页面：overview/activity/discussion/documents/files/task/team/settings |
| `/[lang]/task` | `(apps)/task/page.tsx` | 任务管理，含创建/编辑/列表/侧边栏/表格 |

### 5.2.1 文档 / Datasheet（`(dashboard)/documents/`）

| 路由 | 文件 | 功能 |
|------|------|------|
| `/[lang]/documents` | `documents/page.tsx` | Univer 表格文档列表，新建 |
| `/[lang]/documents/[documentId]` | `documents/[documentId]/page.tsx` | 标准编辑；侧栏 Tabs「AI 助手」（Hermes）+「数据操作」（CopilotKit Patch）；保存可带可选 AI 追溯字段 |
| `/[lang]/documents/[documentId]/workbook` | `documents/[documentId]/workbook/page.tsx` | AI 工作台（与详情页同源组件，`variant="workbook"`） |

#### 项目详情子页面

| 路由 | 文件 | 功能 |
|------|------|------|
| `/[lang]/projects/[id]` | `overview/page.tsx` | 项目概览：预算/截止日期/进度/报告图表/工作负载/贡献者 |
| `/[lang]/projects/[id]` | `activity/page.tsx` | 项目活动记录 |
| `/[lang]/projects/[id]` | `discussion/page.tsx` | 项目讨论区，消息列表+发送 |
| `/[lang]/projects/[id]` | `documents/page.tsx` | 项目文档，卡片展示 |
| `/[lang]/projects/[id]` | `files/page.tsx` | 项目文件管理 |
| `/[lang]/projects/[id]` | `task/page.tsx` | 项目任务列表 |
| `/[lang]/projects/[id]` | `team/page.tsx` | 项目团队成员 |
| `/[lang]/projects/[id]` | `settings/page.tsx` | 项目设置 |

### 5.3 图表模块 (`(chart)/`)

#### ApexCharts (`(appex-charts)/`)

| 路由 | 功能 |
|------|------|
| `/[lang]/charts-appex-area` | 面积图 |
| `/[lang]/charts-appex-bar` | 柱状图 |
| `/[lang]/charts-appex-boxplot` | 箱线图 |
| `/[lang]/charts-appex-bubble` | 气泡图 |
| `/[lang]/charts-appex-candlestick` | K线图 |
| `/[lang]/charts-appex-column` | 列图 |
| `/[lang]/charts-appex-combo` | 组合图（线柱/线面/多Y轴） |
| `/[lang]/charts-appex-funnel` | 漏斗图/金字塔图 |
| `/[lang]/charts-appex-heatmap` | 热力图 |
| `/[lang]/charts-appex-line` | 折线图（渐变/虚线/刷选） |
| `/[lang]/charts-appex-pie` | 饼图/环形图 |
| `/[lang]/charts-appex-polararea` | 极坐标面积图 |
| `/[lang]/charts-appex-radar` | 雷达图 |
| `/[lang]/charts-appex-radialbars` | 径向条形图 |
| `/[lang]/charts-appex-range` | 范围图 |
| `/[lang]/charts-appex-scatter` | 散点图 |
| `/[lang]/charts-appex-timeline` | 时间线图 |
| `/[lang]/charts-appex-treemap` | 树图 |

#### Chart.js (`(chart-js)/`)

| 路由 | 功能 |
|------|------|
| `/[lang]/charts-chartjs-animations` | 动画效果 |
| `/[lang]/charts-chartjs-area` | 面积图 |
| `/[lang]/charts-chartjs-bar` | 柱状图 |
| `/[lang]/charts-chartjs-legend` | 图例 |
| `/[lang]/charts-chartjs-line` | 折线图 |
| `/[lang]/charts-chartjs-other` | 其他图表 |
| `/[lang]/charts-chartjs-scaleoptions` | 刻度选项 |
| `/[lang]/charts-chartjs-scales` | 刻度 |
| `/[lang]/charts-chartjs-scriptable` | 可脚本化选项 |
| `/[lang]/charts-chartjs-title` | 标题 |
| `/[lang]/charts-chartjs-tooltip` | 提示框 |

#### Recharts (`(re-chart)/`)

| 路由 | 功能 |
|------|------|
| `/[lang]/charts-rechart-area` | 面积图 |
| `/[lang]/charts-rechart-bar` | 柱状图 |
| `/[lang]/charts-rechart-composed` | 组合图 |
| `/[lang]/charts-rechart-line` | 折线图 |
| `/[lang]/charts-rechart-pie` | 饼图 |
| `/[lang]/charts-rechart-radar` | 雷达图 |
| `/[lang]/charts-rechart-radialbar` | 径向条形图 |
| `/[lang]/charts-rechart-scatter` | 散点图 |
| `/[lang]/charts-rechart-treemap` | 树图 |

#### Unovis (`(unovis-charts)/`)

| 路由 | 功能 |
|------|------|
| `/[lang]/charts-unovis-area` | 面积图 |
| `/[lang]/charts-unovis-bar` | 柱状图 |
| `/[lang]/charts-unovis-line` | 折线图 |
| `/[lang]/charts-unovis-scatter` | 散点图 |

### 5.4 UI 组件展示 (`(components)/`)

| 路由 | 功能 |
|------|------|
| `/[lang]/accordion` | 手风琴组件展示 |
| `/[lang]/affix` | 固定定位组件展示 |
| `/[lang]/alert` | 警告组件展示 |
| `/[lang]/avatar` | 头像组件展示 |
| `/[lang]/badge` | 徽章组件展示 |
| `/[lang]/breadcrumb` | 面包屑组件展示 |
| `/[lang]/button` | 按钮组件展示 |
| `/[lang]/calendar-page` | 日历组件展示 |
| `/[lang]/card` | 卡片组件展示 |
| `/[lang]/carousel` | 轮播组件展示 |
| `/[lang]/color` | 颜色组件展示 |
| `/[lang]/combobox` | 组合框组件展示 |
| `/[lang]/command` | 命令面板展示 |
| `/[lang]/dialog` | 对话框展示 |
| `/[lang]/dropdown` | 下拉菜单展示 |
| `/[lang]/kbd` | 键盘按键展示 |
| `/[lang]/pagination` | 分页展示 |
| `/[lang]/popover` | 弹出层展示 |
| `/[lang]/progress` | 进度条展示 |
| `/[lang]/sheet` | 侧滑面板展示 |
| `/[lang]/skeleton` | 骨架屏展示 |
| `/[lang]/steps` | 步骤条展示 |
| `/[lang]/tabs` | 标签页展示 |
| `/[lang]/timeline` | 时间线展示 |
| `/[lang]/toast` | Toast 通知展示 |
| `/[lang]/tooltip` | 工具提示展示 |
| `/[lang]/tour` | 引导步骤展示 |
| `/[lang]/tree` | 树形组件展示 |
| `/[lang]/typography` | 排版展示 |
| `/[lang]/watermark` | 水印组件展示 |

### 5.5 表单模块 (`(forms)/`)

| 路由 | 功能 |
|------|------|
| `/[lang]/checkbox` | 复选框表单 |
| `/[lang]/file-uploader` | 文件上传表单 |
| `/[lang]/form-layout` | 表单布局 |
| `/[lang]/form-select` | 表单选择器 |
| `/[lang]/form-wizard` | 表单向导（多步骤） |
| `/[lang]/input` | 输入框表单 |
| `/[lang]/input-mask` | 输入掩码表单 |
| `/[lang]/input2` | 输入框变体 2 |
| `/[lang]/radio` | 单选按钮表单 |
| `/[lang]/rating` | 评分表单 |
| `/[lang]/react-select` | React Select 表单 |
| `/[lang]/slider` | 滑块表单 |
| `/[lang]/switch` | 开关表单 |
| `/[lang]/textarea` | 文本域表单 |
| `/[lang]/validation-controller` | 表单验证（Controller 模式） |
| `/[lang]/validation-useform` | 表单验证（useForm 模式） |

### 5.6 流程图模块 (`(diagram)/`)

| 路由 | 功能 |
|------|------|
| `/[lang]/diagram-add-node` | 动态添加节点 |
| `/[lang]/diagram-dagree-tree` | DAG 树形图 |
| `/[lang]/diagram-overview` | 流程图概览 |
| `/[lang]/diagram-panel-position` | 面板位置 |
| `/[lang]/diagram-updating` | 动态更新节点 |
| `/[lang]/diagram-with-background` | 带背景流程图 |
| `/[lang]/diagram-with-minimap` | 带小地图流程图 |
| `/[lang]/download-diagram` | 可下载流程图 |
| `/[lang]/horizontal-diagram` | 水平流程图 |
| `/[lang]/organization-diagram` | 组织架构图 |

### 5.7 发票模块 (`(invoice)/`)

| 路由 | 文件 | 功能 |
|------|------|------|
| `/[lang]/invoice-list` | `(invoice)/invoice-list/page.tsx` | 发票列表，含统计图表+DataTable |
| `/[lang]/create-invoice` | `(invoice)/create-invoice/page.tsx` | 创建发票 |
| `/[lang]/invoice-details` | `(invoice)/invoice-details/page.tsx` | 发票详情 |

### 5.8 地图模块 (`(map)/`)

| 路由 | 功能 |
|------|------|
| `/[lang]/map-react-leaflet` | React Leaflet 地图（基础/GeoJSON） |
| `/[lang]/map-unovis-advance` | Unovis 高级地图 |
| `/[lang]/map-unovis-flow` | Unovis 流向地图 |
| `/[lang]/map-unovis-leaflet` | Unovis Leaflet 地图 |
| `/[lang]/maps-vector` | 矢量地图 |

### 5.9 表格模块 (`(tables)/`)

| 路由 | 功能 |
|------|------|
| `/[lang]/data-table` | 高级数据表格（排序/筛选/分页/列显隐） |
| `/[lang]/simple-table` | 简单表格 |
| `/[lang]/tailwindui-table` | TailwindUI 风格表格 |

### 5.10 图标模块 (`(icons)/`)

| 路由 | 功能 |
|------|------|
| `/[lang]/icons-custom` | 自定义图标展示 |
| `/[lang]/icons-iconify` | Iconify 图标展示 |
| `/[lang]/icons-lucide` | Lucide 图标展示 |

### 5.11 其他 Dashboard 页面

| 路由 | 文件 | 功能 |
|------|------|------|
| `/[lang]/blank` | `blank/page.tsx` | 空白页 |
| `/[lang]/react-email` | `react-email/page.tsx` | React Email 模板展示（含多种邮件模板） |
| `/[lang]/user-profile` | `user-profile/page.tsx` | 用户资料页（概览/活动/文档/设置） |

#### 用户资料子页面

| 路由 | 功能 |
|------|------|
| `/[lang]/user-profile` (overview) | 用户概览：个人信息/技能/项目/连接/作品集/近期活动 |
| `/[lang]/user-profile/activity` | 活动时间线 |
| `/[lang]/user-profile/documents` | 文档管理 |
| `/[lang]/user-profile/settings` | 设置：个人详情/密码/技能/社交/元信息 |

#### React Email 子页面

| 路由 | 功能 |
|------|------|
| `/[lang]/react-email/agency` | Agency 邮件模板 |
| `/[lang]/react-email/auth/reset-password` | 重置密码邮件 |
| `/[lang]/react-email/auth/verify-email` | 验证邮箱邮件 |
| `/[lang]/react-email/auth/verify-otp` | OTP 验证邮件 |
| `/[lang]/react-email/basic-welcome` | 基础欢迎邮件 |
| `/[lang]/react-email/blog` | 博客邮件 |
| `/[lang]/react-email/corporate` | 企业邮件 |
| `/[lang]/react-email/photography` | 摄影邮件 |
| `/[lang]/react-email/ecommerce-cart` | 购物车邮件 |
| `/[lang]/react-email/ecommerce-shop` | 商店邮件 |

---

## 六、API 路由 (`/api/`)

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth 认证处理器 |
| `/api/copilot` | POST | CopilotKit 运行时端点（Hermes LLM） |
| `/api/boards` | GET/POST/PATCH | 看板列表：获取全部/新增/交换顺序 |
| `/api/boards/[id]` | PUT/DELETE | 单个看板：更新/删除 |
| `/api/calendars` | GET/POST | 日历事件：获取全部/新增 |
| `/api/chat` | GET | 聊天：获取联系人列表 |
| `/api/chat/messages` | POST | 发送聊天消息 |
| `/api/chat/messages/[id]` | GET/DELETE | 获取聊天详情/删除消息 |
| `/api/chat/profile-data` | GET | 获取聊天个人资料 |
| `/api/comments` | GET/POST | 评论：获取全部/新增 |
| `/api/email/*` | ALL | 邮件前端代理入口，经 `middleware.ts` 转发到 backend `/api/v1/email/*` |
| `/api/projects` | GET/POST | 项目：获取全部/新增 |
| `/api/projects/[id]` | GET/PUT/DELETE | 单个项目：获取/更新/删除 |
| `/api/tasks` | GET/POST | 任务：获取全部/新增 |
| `/api/tasks/[id]` | PUT/DELETE | 单个任务：更新/删除 |
| `/api/tasks/subtasks` | GET/POST | 子任务：获取全部/新增 |
| `/api/tasks/subtasks/[id]` | PUT/DELETE | 单个子任务：更新/删除 |
| `/api/user/register` | POST | 用户注册 |

---

## 七、页面统计

| 分类 | 数量 |
|------|------|
| 认证页面（6类 x 5变体） | 30 |
| 错误页面 | 7 |
| 工具页面 | 2 |
| 首页/仪表盘 | 3 |
| 应用页面 | 6 + 项目详情 8 |
| 图表页面（ApexCharts 18 + Chart.js 11 + Recharts 9 + Unovis 4） | 42 |
| 组件展示页面 | 30 |
| 表单页面 | 16 |
| 流程图页面 | 10 |
| 发票页面 | 3 |
| 地图页面 | 5 |
| 表格页面 | 3 |
| 图标页面 | 3 |
| 其他（空白/邮件模板/用户资料） | 3 + 10 + 4 |
| **总计** | **约 185 个页面** |
