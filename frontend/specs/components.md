# 组件清单与示例

> 本文档由全量代码扫描生成，供 Agent 在开发时快速定位可用组件。

---

## 一、UI 基础组件库 (`components/ui/`)

基于 Shadcn/UI 架构（Radix UI + Tailwind CSS + CVA），共 50+ 组件。

### 1.1 Radix UI 封装组件

| 组件 | 文件 | Radix 原始包 | 导出子组件 | 常用场景 |
|------|------|-------------|-----------|---------|
| Accordion | `ui/accordion.tsx` | `@radix-ui/react-accordion` | AccordionItem, AccordionTrigger, AccordionContent | FAQ、可折叠面板 |
| AlertDialog | `ui/alert-dialog.tsx` | `@radix-ui/react-alert-dialog` | AlertDialogTrigger/Content/Header/Footer/Title/Description/Action/Cancel | 危险操作确认 |
| AspectRatio | `ui/aspect-ratio.tsx` | `@radix-ui/react-aspect-ratio` | - | 固定宽高比容器 |
| Avatar | `ui/avatar.tsx` | `@radix-ui/react-avatar` | AvatarImage, AvatarFallback, AvatarGroup | 用户头像 |
| Checkbox | `ui/checkbox.tsx` | `@radix-ui/react-checkbox` | - | 多选框，支持多色变体 |
| Collapsible | `ui/collapsible.tsx` | `@radix-ui/react-collapsible` | CollapsibleTrigger, CollapsibleContent | 折叠/展开 |
| Dialog | `ui/dialog.tsx` | `@radix-ui/react-dialog` | DialogTrigger/Content/Header/Footer/Title/Description/Close | 模态对话框，支持多尺寸 |
| DropdownMenu | `ui/dropdown-menu.tsx` | `@radix-ui/react-dropdown-menu` | DropdownMenuTrigger/Content/Item/Label/Separator/Group/Sub/SubTrigger/SubContent/RadioGroup/RadioItem | 右键/下拉菜单 |
| Form | `ui/form.tsx` | `@radix-ui/react-label` + `react-hook-form` | FormField/FormItem/FormLabel/FormControl/FormDescription/FormMessage | 表单集成 react-hook-form |
| HoverCard | `ui/hover-card.tsx` | `@radix-ui/react-hover-card` | HoverCardTrigger, HoverCardContent, HoverArrow | 悬浮信息卡 |
| Label | `ui/label.tsx` | `@radix-ui/react-label` | - | 表单标签 |
| Menubar | `ui/menubar.tsx` | `@radix-ui/react-menubar` | MenubarMenu/Trigger/Content/Item/Separator/Sub/SubTrigger/SubContent/RadioGroup/RadioItem/CheckboxItem | 顶部菜单栏 |
| NavigationMenu | `ui/navigation-menu.tsx` | `@radix-ui/react-navigation-menu` | NavigationMenuList/Item/Content/Trigger/Link/Indicator | 水平导航 |
| Popover | `ui/popover.tsx` | `@radix-ui/react-popover` | PopoverTrigger, PopoverContent, PopoverClose, PopoverArrow | 弹出层 |
| Progress | `ui/progress.tsx` | `@radix-ui/react-progress` | - | 进度条，支持多色/多尺寸 |
| RadioGroup | `ui/radio-group.tsx` | `@radix-ui/react-radio-group` | RadioGroupItem | 单选按钮组 |
| ScrollArea | `ui/scroll-area.tsx` | `@radix-ui/react-scroll-area` | ScrollBar | 自定义滚动区域 |
| Select | `ui/select.tsx` | `@radix-ui/react-select` | SelectTrigger/Value/Content/Item/Group/Label/Separator | 下拉选择 |
| Separator | `ui/separator.tsx` | `@radix-ui/react-separator` | - | 分隔线 |
| Sheet | `ui/sheet.tsx` | `@radix-ui/react-dialog` | SheetTrigger/Content/Header/Footer/Title/Description/Close | 侧滑面板 |
| Slider | `ui/slider.tsx` | `@radix-ui/react-slider` | - | 滑块选择器，支持多色+Tooltip |
| Switch | `ui/switch.tsx` | `@radix-ui/react-switch` | - | 开关切换，支持多色/多尺寸 |
| Tabs | `ui/tabs.tsx` | `@radix-ui/react-tabs` | TabsList, TabsTrigger, TabsContent | 标签页切换 |
| Toast | `ui/toast.tsx` | `@radix-ui/react-toast` | ToastProvider/Viewport/Toast/Title/Description/Close/Action | 通知提示 |
| Toggle | `ui/toggle.tsx` | `@radix-ui/react-toggle` | - | 切换按钮 |
| Tooltip | `ui/tooltip.tsx` | `@radix-ui/react-tooltip` | TooltipTrigger, TooltipContent, TooltipProvider, TooltipArrow | 工具提示，支持多色 |

### 1.2 第三方库封装组件

| 组件 | 文件 | 第三方库 | 说明 |
|------|------|---------|------|
| Calendar | `ui/calendar.tsx` | `react-day-picker` | 日历日期选择器 |
| Carousel | `ui/carousel.tsx` | `embla-carousel-react` | 轮播组件，含 Content/Item/Previous/Next |
| CleaveInput | `ui/cleave.tsx` | `cleave.js` | 格式化输入框（电话/信用卡等） |
| Drawer | `ui/drawer.tsx` | `vaul` | 底部滑出抽屉，含 Trigger/Content/Header/Footer/Title/Description/Close |
| Rating | `ui/rating.tsx` | `@smastrom/react-rating` | 星级评分 |
| Resizable | `ui/resizable.tsx` | `react-resizable-panels` | 可调整大小面板，含 PanelGroup/Panel/Handle |
| SonnToaster | `ui/sonner.tsx` | `sonner` | Sonner toast 容器 |
| Command | `ui/command.tsx` | `cmdk` + `@radix-ui/react-dialog` | 命令面板搜索，含 Dialog/Input/List/Empty/Group/Item/Separator/Shortcut |

### 1.3 纯自定义 UI 组件

| 组件 | 文件 | 说明 | 特性 |
|------|------|------|------|
| Affix | `ui/affix.tsx` | 固定定位组件 | 自定义实现 |
| Alert | `ui/alert.tsx` | 警告提示框 | CVA 多色变体 |
| Badge | `ui/badge.tsx` | 徽章标签 | CVA 多色/多变体 |
| Breadcrumbs | `ui/breadcrumbs.tsx` | 面包屑导航 | 含 Item/Separator/Ellipsis |
| Button | `ui/button.tsx` | 按钮 | CVA 多色/多尺寸/多变体(default/destructive/outline/secondary/ghost/link/subtle) |
| Card | `ui/card.tsx` | 卡片容器 | 含 Header/Footer/Title/Description/Content |
| CardSnippet | `ui/card-snippet.tsx` | 代码片段卡片 | 组合 Card+Collapsible+Switch+SyntaxHighlighter |
| Input | `ui/input.tsx` | 输入框 | CVA 多色/多变体/多尺寸 |
| InputGroup | `ui/input-group.tsx` | 输入框组合 | 含 InputText/InputAddon |
| Kbd | `ui/kbd.tsx` | 键盘按键标签 | CVA 变体 |
| Pagination | `ui/pagination.tsx` | 分页导航 | 含 Content/Item/Link/Previous/Next/Ellipsis |
| Skeleton | `ui/skeleton.tsx` | 骨架屏 | 加载占位 |
| Steps | `ui/steps.tsx` | 步骤条 | 含 Step/StepItem |
| Table | `ui/table.tsx` | 表格 | 含 Header/Body/Footer/Head/Row/Cell/Caption |
| Textarea | `ui/textarea.tsx` | 多行文本框 | CVA 变体 |
| Timeline | `ui/timeline.tsx` | 时间线 | 含 Item/Content/Heading/Dot/Line/Separator |
| Tree | `ui/tree.tsx` | 树形组件 | 含 TreeNode，支持勾选/展开/选择 |
| Watermark | `ui/watermark/` | 水印组件 | 基于 SVG 生成旋转文字水印 |

### 1.4 Toast 系统

| 组件/Hook | 文件 | 说明 |
|-----------|------|------|
| useToast | `ui/use-toast.ts` | Toast 状态管理 Hook |
| Toaster | `ui/toaster.tsx` | Radix Toast 渲染容器 |
| SonnToaster | `ui/sonner.tsx` | Sonner Toast 渲染容器 |

> 项目同时使用三种 Toast：Radix Toast (`ui/toaster.tsx`)、react-hot-toast、Sonner (`ui/sonner.tsx`)

---

## 二、业务组件 (`components/` 非 ui 目录)

### 2.1 通用业务组件

| 组件 | 文件 | Props | 功能 |
|------|------|-------|------|
| Blank | `blank.tsx` | `{ children, img?, className? }` | 空白占位，显示居中图片+子内容 |
| DashboardSelect | `dasboard-select.tsx` | 无 | 仪表盘日期选择下拉框 |
| DashboardDropdown | `dashboard-dropdown.tsx` | 无 | 仪表盘操作下拉菜单（View All/Download/Refresh） |
| DatePickerWithRange | `date-picker-with-range.tsx` | `{ className? }` | 带范围选择的日期选择器 |
| DeleteConfirmationDialog | `delete-confirmation-dialog.tsx` | `{ open, onClose, onConfirm, defaultToast?, toastMessage? }` | 删除确认对话框，支持异步确认+toast |
| ErrorBlock | `error-block.tsx` | 无 | 404 错误页面块 |
| HeaderSearch | `header-search.tsx` | `{ open, setOpen }` | 头部搜索弹窗，基于 Command 组件 |
| LayoutLoader | `layout-loader.tsx` | 无 | 布局加载动画 |

### 2.2 认证组件 (`components/auth/`)

| 组件 | 文件 | Props | 功能 |
|------|------|-------|------|
| LogInForm | `auth/login-form.tsx` | 无（内部 zod schema: email+password） | 登录表单，支持邮箱密码+社交登录(Google/Facebook/Twitter/GitHub) |
| VerfiyForm | `auth/verify-form.tsx` | 无 | OTP 验证码表单，6位数字输入 |

### 2.3 文件组件 (`components/files/`)

| 组件 | 文件 | Props | 功能 |
|------|------|-------|------|
| ViewFiles | `files/view-files.tsx` | 无 | 文件管理主视图，支持网格/列表切换、搜索、上传 |
| ListFileCard | `files/list-file-card.tsx` | `{ files: File[] }` | 文件列表视图，支持全选/行选择 |
| SingleFileCard | `files/single-file-card.tsx` | `{ item: File }` | 单个文件卡片，根据扩展名显示图标 |

### 2.4 任务看板组件 (`components/task-board/`)

| 组件 | 文件 | Props | 功能 |
|------|------|-------|------|
| TaskBoard | `task-board/index.tsx` | 无 | 任务看板主入口，支持 Kanban/List 视图切换，基于 @dnd-kit 拖拽 |
| Board | `task-board/board.tsx` | 内部 board 数据 | 看板列组件，支持拖拽排序、删除 |
| Task | `task-board/task.tsx` | 内部 task 数据 | 单个任务卡片，显示标签/头像/日期 |
| AddTask | `task-board/add-task.tsx` | 无 | 添加任务表单，react-hook-form + zod |
| CreateBoard | `task-board/create-borad.tsx` | `{ open, ... }` | 创建/编辑看板列对话框 |
| TaskHeader | `task-board/task-header.tsx` | `{ taskViewHandler, openCreateBoard, taskView }` | 任务看板头部 |

### 2.5 落地页组件 (`components/landing-page/`)

| 组件 | 文件 | 功能 |
|------|------|------|
| LandingPageView | `index.tsx` | 落地页主入口，组合所有子区块 |
| Hero | `hero.tsx` | 首屏英雄区块，framer-motion 动画 |
| Stats | `stats.tsx` | 统计数据区块 |
| AllComponents | `all-components.tsx` | 组件集合展示，Swiper 轮播 |
| AboutDashtail | `about-dashtail.tsx` | CopilotSMC 特性介绍 |
| AboutUs | `about-us.tsx` | 关于我们 |
| Faq | `faq.tsx` | FAQ，Accordion 展示 |
| PricingPlan | `pricing-plan.tsx` | 定价方案 |
| ProjectTools | `project-tools.tsx` | 技术栈展示 |
| FigmaKit | `figma-kit.tsx` | Figma 设计资源 |
| CustomProject | `custom-project.tsx` | 相关项目展示 |
| Contact | `contact.tsx` | 联系区块 |
| Footer | `footer.tsx` | 落地页页脚 |

### 2.6 布局局部组件 (`components/partials/`)

#### Header (`partials/header/`)

| 组件 | 文件 | 功能 |
|------|------|------|
| NavTools | `index.tsx` | 头部导航工具栏，组合 Language/FullScreen/ThemeButton/Inbox/Notification/Profile |
| FullScreenToggle | `full-screen.tsx` | 全屏切换按钮 |
| horizontalHeader | `horizontal-header.tsx` | 水平布局头部 |
| MainMenu | `horizontal-menu.tsx` | 水平导航菜单，基于 Radix NavigationMenu |
| Inbox | `inbox.tsx` | 收件箱下拉 |
| Language | `language.tsx` | 语言切换（en/bn/ar） |
| MobileMenuHandler | `mobile-menu-handler.tsx` | 移动端菜单按钮 |
| NotificationMessage | `notification-message.tsx` | 通知消息下拉 |
| ProfileInfo | `profile-info.tsx` | 用户头像下拉菜单，基于 next-auth |
| ThemeButton | `theme-button.tsx` | 主题切换（亮/暗/系统） |
| MenuBar | `vertical-header.tsx` | 垂直布局头部菜单栏 |

#### Sidebar (`partials/sidebar/`)

| 组件 | 文件 | 功能 |
|------|------|------|
| Sidebar | `index.tsx` | 侧边栏主入口，根据 sidebarType 选择 Module/Popover/Classic/Mobile |

> 侧边栏变体：`module/`（现代模块化）、`classic/`（经典分组）、`popover/`（悬浮折叠）、`mobile-sidebar/`（移动端）、`common/`（共享子组件）

#### Footer (`partials/footer/`)

| 组件 | 文件 | 功能 |
|------|------|------|
| Footer | `index.tsx` | 页脚主入口，根据 layout/footerType/isMobile 选择样式 |
| FooterLayout | `footer-layout.tsx` | 页脚布局容器 |
| MobileFooter | `mobile-footer.tsx` | 移动端底部导航栏 |

#### Customizer (`partials/customizer/`)

| 组件 | 文件 | 功能 |
|------|------|------|
| ThemeCustomize | `theme-customizer.tsx` | 主题定制面板（Sheet 侧滑），组合所有定制子组件 |
| SelectLayout | `select-layout.tsx` | 布局选择（Vertical/Horizontal/Semi-Box） |
| SelectTheme | `select-theme.tsx` | 明暗主题选择 |
| ThemeChange | `theme-change.tsx` | 主题颜色方案选择（12套） |
| SidebarChange | `sidebar-change.tsx` | 侧边栏类型选择（Module/Classic/Popover） |
| HeaderStyle | `header-style.tsx` | 头部类型选择 |
| FooterStyle | `footer-style.tsx` | 页脚类型选择 |
| RadiusInit | `radius.tsx` | 圆角大小选择 |
| RtlSwitcher | `rtl-switch.tsx` | RTL/LTR 方向切换 |
| SidebarImage | `sidebar-image.tsx` | 侧边栏背景图片选择 |

### 2.7 SVG 图标 (`components/svg/`)

`components/svg/index.ts` 统一导出约 90+ 个 SVG 图标，分为三类：
- **layout**: SiteLogo, Settings, Bell, Envelope, DashBoard, Sun, Moon 等
- **duel-tone**: 双色调图标
- **home**: 首页专用图标

---

## 三、AI Copilot 组件 (`ai/components/`)

| 组件 | 文件 | Props | 功能 |
|------|------|-------|------|
| GlobalCopilotSidebar | `GlobalCopilotSidebar.tsx` | 无 | 全局 AI 侧边栏面板（宽 400px），基于 CopilotKit |
| GlobalCopilotTrigger | `GlobalCopilotTrigger.tsx` | 无 | 固定右下角 AI 助手触发按钮 |
| CopilotSessionPanel | `CopilotSessionPanel.tsx` | `{ context?: PageCopilotContext }` | AI 会话主面板，组合 ContextCard+MessageList+ActionList+Composer |
| CopilotComposer | `CopilotComposer.tsx` | `{ loading?, onSend }` | AI 对话输入框+发送按钮 |
| CopilotMessageList | `CopilotMessageList.tsx` | `{ messages: CopilotMessage[] }` | AI 对话消息列表 |
| CopilotActionList | `CopilotActionList.tsx` | `{ actions?, onInvoke? }` | 当前页面可用 AI 动作按钮列表 |
| CopilotContextCard | `CopilotContextCard.tsx` | `{ context?: PageCopilotContext }` | 当前页面 AI 上下文信息卡片 |

---

## 四、组件使用示例

### 4.1 Button 变体

```tsx
import { Button } from "@/components/ui/button";

// 基础用法
<Button>Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

### 4.2 Dialog 对话框

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

<Dialog>
  <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>标题</DialogTitle>
      <DialogDescription>描述</DialogDescription>
    </DialogHeader>
    {/* 内容 */}
    <DialogFooter><Button>确认</Button></DialogFooter>
  </DialogContent>
</Dialog>
```

### 4.3 Form 表单（react-hook-form 集成）

```tsx
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({ name: z.string().min(1, "必填") });
const form = useForm({ resolver: zodResolver(schema), defaultValues: { name: "" } });

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField control={form.control} name="name" render={({ field }) => (
      <FormItem><FormLabel>名称</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
    )} />
  </form>
</Form>
```

### 4.4 DataTable 数据表格

```tsx
// 项目中已有完整 DataTable 实现，参考：
// app/[lang]/(dashboard)/(apps)/projects/project-list/components/
// - columns.tsx          列定义
// - data-table-toolbar.tsx  工具栏（搜索/筛选/视图切换）
// - data-table-faceted-filter.tsx  分面筛选
// - data-table-column-header.tsx  可排序列头
// - data-table-view-options.tsx  列显隐控制
```

### 4.5 DeleteConfirmationDialog 删除确认

```tsx
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog";

<DeleteConfirmationDialog
  open={open}
  onClose={() => setOpen(false)}
  onConfirm={async () => { await deleteItem(id); }}
  defaultToast={true}
  toastMessage="删除成功"
/>
```

### 4.6 DatePickerWithRange 日期范围选择

```tsx
import DatePickerWithRange from "@/components/date-picker-with-range";

<DatePickerWithRange className="w-full" />
```

### 4.7 Email 模块业务组件（`modules/email/components/`）

| 组件 | 文件 | 说明 |
|------|------|------|
| EmailWorkspace | `email-workspace.tsx` | 邮箱主工作区：三栏可缩放、列表/详情切换、Copilot 钩子挂载 |
| EmailTiptapEditor | `email-tiptap-editor.tsx` | Tiptap 富文本（StarterKit + Link/Image/Placeholder/Underline），`ref` 暴露 `getHTML`/`getText`/`setContent` |
| EmailComposeForm | `email-compose-form.tsx` | 撰写（发送、`in_reply_to`/`references`、浮层/全屏切换、内联调用撰写 AI） |
| EmailComposeWorkspace | `email-compose-workspace.tsx` | 全屏撰写壳层（顶栏 + 主区 + 可选右侧栏），由 `EmailComposeForm` 在全屏模式下组合 |
| EmailAIPanel / EmailComposeAIPanel | `email-ai-panel.tsx`、`email-compose-ai-panel.tsx` | 右侧邮件 AI、全屏撰写侧 AI |
| EmailDetailPane / EmailThreadView / EmailActionBar | `email-detail-pane.tsx`、`email-thread-view.tsx`、`email-action-bar.tsx` | 详情区：线程折叠、操作条（回复/转发/快捷 AI） |
| EmailAiResultCard / EmailAiActionButton | `email-ai-result-card.tsx`、`email-ai-action-button.tsx` | Markdown 结果展示与快捷动作按钮 |
