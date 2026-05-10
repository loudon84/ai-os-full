《Hermes Finance 模块前端 Spec Coding 方案（React 18 + CopilotKit 既有项目内落地版）》
1. 目标与边界
1.1 目标

在现有 React 18 + CopilotKit 项目中新增 finance 模块，形成一个 财务智能助手工作台，覆盖以下核心能力：

财务分析总入口
应收账款风险分析
现金流预测
发票 / 费用异常识别
财务分析报告中心
审批与审计工作台
1.2 明确边界

本次改造 不是：

重做全站 layout
重做导航
重做通用表格 / Drawer / Tabs / PageHeader
用 CopilotKit 替代原页面框架
改动 HiClaw / NoDeskClaw / Hermes runtime

本次改造 是：

在现有 UI 壳内挂接 finance 业务模块
沿用现有 React 18 项目的 layout、页面骨架、主题和基础组件
让 CopilotKit 只承担 AI 交互壳、事件流、前端工具和生成式 UI 区块职责；CopilotKit 本身不负责样式系统和业务逻辑。
让 Hermes 继续保持单一代理运行循环，不把代理逻辑搬到前端。
2. 总体落地原则
2.1 模块接入原则

finance 模块必须遵守以下 5 条硬约束：

挂在现有主 layout 下
继续使用现有 AppShell / DashboardLayout / WorkspaceLayout 等项目已有页面壳
不新增第二套根级布局
复用现有页面级组件
复用已有：
PageHeader
SectionCard
Tabs
Drawer
FilterBar
EmptyState
ErrorState
LoadingBlock
DataTable 外壳（若已有）
若现有项目已有这些语义组件，必须先复用，再考虑 finance-specific 包装
CopilotKit 只嵌入业务区块
放在 Query Bar、AI Explanation、Copilot Side Panel、Follow-up 区
不接管整个页面 layout。CopilotKit 的稳定职责是 AG-UI 协议、前后端事件流、工具执行和状态同步。
finance 模块使用模块内目录，不污染全局
财务模块组件、hooks、types、mock、service 全部收口到 finance/ 下
通用复用能力抽到 shared，不在一开始污染 shared
必须继承现有样式与设计 token
沿用当前项目：
spacing
radius
typography
color tokens
breakpoint
card shadow
page margin / content max width
禁止引入与现有页面风格冲突的新视觉体系
3. 推荐目录结构

以下目录结构是 在现有 React 18 + CopilotKit 项目里新增 finance 模块 的推荐形态。

这里不强绑定你是 React Router 还是 Next App Router，按“模块目录”表达。

src/
  modules/
    finance/
      index.ts
      routes.tsx
      pages/
        FinanceWorkbenchPage.tsx
        ReceivablesRiskPage.tsx
        CashflowForecastPage.tsx
        InvoiceAnomaliesPage.tsx
        ReportCenterPage.tsx
        ApprovalsAuditPage.tsx
      components/
        layout/
          FinanceModuleShell.tsx
          FinanceSidebarNav.tsx
          FinanceContextPanel.tsx
        workbench/
          FinanceQueryBar.tsx
          FinanceKpiSummary.tsx
          FinanceResultTabs.tsx
          FinanceExecutionTimeline.tsx
          FinanceAiExplanation.tsx
        receivables/
          ReceivableFilterBar.tsx
          ReceivableRiskTable.tsx
          ReceivableDetailDrawer.tsx
        forecast/
          ForecastScenarioTabs.tsx
          CashflowTrendPanel.tsx
          ForecastFactorTable.tsx
        anomalies/
          AnomalyRuleStatusBar.tsx
          InvoiceAnomalyTable.tsx
          AnomalyDetailDrawer.tsx
        reports/
          ReportListTable.tsx
          FinanceReportEditor.tsx
          ReportVersionPanel.tsx
        approvals/
          ApprovalQueueTable.tsx
          ApprovalDetailPanel.tsx
          AuditTrailPanel.tsx
        shared/
          FinanceMetricCard.tsx
          RiskBadge.tsx
          CurrencyCell.tsx
          StatusPill.tsx
          SourceRefList.tsx
      hooks/
        useFinanceWorkbench.ts
        useReceivablesRisk.ts
        useCashflowForecast.ts
        useInvoiceAnomalies.ts
        useReportCenter.ts
        useApprovalsAudit.ts
      services/
        finance.api.ts
        finance.actions.ts
        finance.mappers.ts
      types/
        finance.types.ts
        finance.contracts.ts
      mocks/
        finance.mock.ts
        finance.seed.ts
      specs/
        README.md
        PRD.md
        PAGE-SPEC.md
        DESIGN.md
        COMPONENTS.md
        DATA-CONTRACT.md
        ACTION-CONTRACT.md
        PROMPT.md
        REVIEW-CHECKLIST.md
4. 路由与导航接入规范
4.1 模块路由

建议 finance 模块统一挂到：

/finance
/finance/receivables-risk
/finance/cashflow-forecast
/finance/invoice-anomalies
/finance/reports
/finance/approvals
4.2 导航接入要求

若现有项目有侧边导航 / 顶部导航系统，则只新增一个一级入口：

Finance
Workbench
Receivables Risk
Cashflow Forecast
Invoice Anomalies
Reports
Approvals & Audit
禁止做法
单独给 finance 再造一套全屏导航
在 finance 模块里再嵌一套项目级 Header
用 CopilotKit 面板替代项目主导航
5. Finance 模块布局规范
5.1 工作台中心页布局

finance 模块首页必须采用 工作台中心页，不是“聊天中心页”。

布局结构
5.2 布局说明
左侧

模块内次级导航 / 最近分析任务 / 模板入口

中间

主业务工作区：

查询
KPI
明细结果
风险
AI 解释
报告草稿
右侧

上下文与状态区：

当前筛选条件
风险标签
数据来源
执行状态
审批状态
审计摘要
5.3 与现有 layout 的关系

FinanceModuleShell 必须：

使用现有项目内容容器宽度
使用现有项目页面 header 高度规则
使用现有 grid / flex 页面壳
只在内容区做三栏或二栏细分

禁止改动：

全局 header
全局 sidebar
现有 breadcrumb 机制
全局 page transition 逻辑
6. 页面 1：Finance WorkbenchPage
6.1 页面职责

作为财务分析总入口页，整合：

自然语言分析发起
指标概览
明细结果
风险识别
AI 解释
报告草稿
6.2 页面结构
Header

沿用现有项目 PageHeader

字段：

标题：财务智能助手
日期范围切换
分析模板切换
导出
新建分析
Query Bar

由 FinanceQueryBar 承载：

Copilot 输入区
快捷问题 chips
高级筛选按钮
Run / Stop
KPI Summary

由 FinanceKpiSummary 承载：

应收总额
应付总额
逾期金额
30 天现金流预测
高风险客户数
Result Tabs
概览
明细
风险
AI 解释
报告
Execution Timeline

运行事件流、步骤状态、失败节点

Right Context Panel
当前参数
来源
风险标签
审批状态
审计信息
6.3 页面状态
empty
loading
running
success
error
forbidden
no-data
6.4 组件复用要求

优先复用现有组件：

PageHeader
Tabs
Card
Badge
Drawer
Skeleton
EmptyState

Finance-specific 只包装：

FinanceMetricCard
RiskBadge
FinanceExecutionTimeline
6.5 Cursor 实现要求
不允许做成整页聊天框
Copilot 区块只能在 Query Bar 和 AI Explain Tab 中出现
主体必须是数据工作台
7. 页面 2：ReceivablesRiskPage
7.1 页面职责

应收账款风险分析页，聚焦客户维度风险识别。

7.2 页面结构
Header
页面标题
日期范围
导出
发起催收建议分析
Filter Bar
客户
区域
销售负责人
风险等级
账龄区间
币种
KPI Strip
应收总额
逾期总额
高风险客户数
坏账预估
Risk Table

建议列：

客户名称
应收余额
逾期金额
最大逾期天数
风险等级
风险原因
推荐动作
详情
Detail Drawer
客户画像
历史回款
订单明细
发票明细
AI 风险解释
审计来源
7.3 组件规范
表格优先复用现有通用 Table 外壳
若项目已有 TanStack Table 封装，finance 只定义 columns
金额统一走 CurrencyCell
风险统一走 RiskBadge
8. 页面 3：CashflowForecastPage
8.1 页面职责

提供现金流趋势预测与缺口分析。

8.2 页面结构
Header
页面标题
预测周期切换
场景切换
导出预测报告
Forecast Summary
预测净现金流
最低现金位
缺口预警
高峰支付日
Trend Panel
趋势图
收款 / 付款分层
缺口区间高亮
Factor Table
影响客户
影响供应商
大额付款
大额回款
AI Recommendation
调整付款建议
催收建议
调拨建议
Assumption Panel
数据口径
假设条件
模型说明
审计说明
8.3 样式约束

沿用现有 dashboard 卡片和 chart panel 风格，不单独设计新的图表容器。

9. 页面 4：InvoiceAnomaliesPage
9.1 页面职责

识别发票、费用报销、税率和单据异常。

9.2 页面结构
Header
页面标题
检测时间范围
规则版本
导出异常清单
Rule Status Bar
已启用规则数
异常总数
高风险异常数
已处理数
Tabs
全部
重复报销
税率异常
大额费用
附件缺失
合规风险
Anomaly Table
单据编号
提交人
部门
金额
异常类型
风险等级
原因
处理状态
操作
Detail Drawer
单据详情
命中规则
相似单据
AI 解释
建议处置
审计轨迹
9.3 状态要求

异常处理状态必须至少支持：

未处理
已忽略
已确认
已升级
10. 页面 5：ReportCenterPage
10.1 页面职责

管理分析报告、版本和审批。

10.2 页面结构
Header
页面标题
报告类型筛选
状态筛选
新建报告
导出
Report List Table
报告名称
类型
关联任务
创建人
更新时间
状态
当前审批节点
Detail Layout

左右布局：

左侧
摘要
版本列表
审批流
关联数据集
右侧
报告编辑区
AI 结论插入区
引用来源
审阅意见
10.3 编辑器要求
若现有项目已有富文本 / markdown 编辑器，优先复用其容器和工具栏
若没有，再引入 BlockNote 承载报告编辑区
报告编辑区必须支持：
只读
编辑
版本回看
插入 AI 结论
11. 页面 6：ApprovalsAuditPage
11.1 页面职责

集中承载审批与审计。

11.2 页面结构
Header
待我审批
我已审批
全部审计
导出审计日志
Approval Queue
任务名称
类型
提交人
提交时间
风险等级
当前节点
SLA
Detail Panel
业务摘要
AI 分析结果
风险解释
来源证据
历史审批记录
审计事件流
Action Bar
通过
退回
补充材料
人工复核
12. CopilotKit 接入规范
12.1 放置位置

CopilotKit 只允许放在这些位置：

FinanceQueryBar
FinanceAiExplanation
FollowUpPanel
ExecutionTimeline 的 AI 事件解释子区块
InsertIntoReport 前端工具触发区
12.2 不允许位置
不允许接管 FinanceModuleShell
不允许替代 PageHeader
不允许替代结果表格
不允许承担审批状态机
不允许替代右侧审计面板
12.3 前端工具建议
insert_into_report
open_record_detail
apply_analysis_template
highlight_risk_rows
request_human_review
13. 数据与动作契约
13.1 模块级 types
export type FinanceScenario =
  | "receivable_analysis"
  | "payable_analysis"
  | "cashflow_forecast"
  | "invoice_anomaly"
  | "monthly_report";

export type FinancePageState =
  | "empty"
  | "loading"
  | "running"
  | "success"
  | "error"
  | "forbidden"
  | "no-data";

export type RiskLevel = "low" | "medium" | "high";
13.2 页面动作
runFinanceAnalysis
loadFinanceResult
exportFinanceResult
saveReportDraft
submitReportApproval
askFollowupQuestion
14. 对 Cursor 的硬性生成约束

下面这段，建议直接落到 finance 模块的 specs/PROMPT.md：

你正在为现有 React 18 + CopilotKit 项目新增 finance 模块页面。

必须遵守：
1. 严格沿用现有项目 layout、页面 header、tabs、drawer、card、table、empty/error/loading 组件风格
2. 不得重做全站 layout
3. finance 模块只能新增模块内页面、组件、hooks、types、services
4. CopilotKit 只用于 AI 输入区、事件流、前端工具与生成式 UI 区块
5. 页面主体必须是企业级财务工作台，而不是聊天页
6. 若项目已有通用组件，优先复用；finance-specific 仅允许薄包装
7. 先输出目录树、页面 IA、组件拆分，再输出代码
8. 所有页面必须实现 empty / loading / running / success / error / forbidden / no-data
9. 金额列右对齐，风险列使用 badge，操作列固定右侧
10. 不得引入新的全局 UI 框架
15. Cursor 执行顺序
第一阶段：只做模块骨架
modules/finance/
routes.tsx
FinanceModuleShell
FinanceSidebarNav
六个 page 占位页
types / mocks / service 占位
第二阶段：先做首页工作台
FinanceWorkbenchPage
FinanceQueryBar
FinanceKpiSummary
FinanceResultTabs
FinanceContextPanel
FinanceExecutionTimeline
第三阶段：再做 5 个专题页
应收风险
现金流预测
发票异常
报告中心
审批审计
第四阶段：接入真实 action / API
替换 mock
接入 CopilotKit actions
接入 Hermes runtime / BFF
16. 最终结论

强制要求：

在现有 React 18 + CopilotKit 项目中，以现有 layout 与组件体系为母体，新增一个 finance 模块，采用工作台中心页方案，模块内完成页面、组件、hooks、types、services 的增量扩展，不重做壳层。