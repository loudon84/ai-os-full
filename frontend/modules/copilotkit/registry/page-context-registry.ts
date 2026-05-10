import type { PageCopilotContext } from "@/modules/copilotkit/lib/copilot-types";

export const PAGE_CONTEXT_REGISTRY: Record<
  string,
  Omit<PageCopilotContext, "route">
> = {
  dashboard: {
    pageId: "dashboard",
    pageTitle: "工作台",
    module: "portal",
    summary: "用于查看任务摘要、待办和最近工作结果。",
    actions: [
      {
        id: "summarize-page",
        label: "总结当前页面",
      },
      {
        id: "draft-report",
        label: "生成日报摘要",
      },
      {
        id: "find-risks",
        label: "识别风险点",
      },
    ],
  },
  projects: {
    pageId: "projects",
    pageTitle: "项目管理",
    module: "portal",
    summary: "项目列表与详情管理页面。",
    actions: [
      {
        id: "summarize-page",
        label: "总结当前页面",
      },
      {
        id: "analyze-status",
        label: "分析项目状态",
      },
    ],
  },
  tasks: {
    pageId: "tasks",
    pageTitle: "任务管理",
    module: "portal",
    summary: "任务看板与列表管理页面。",
    actions: [
      {
        id: "summarize-page",
        label: "总结当前页面",
      },
      {
        id: "find-blockers",
        label: "识别阻塞项",
      },
    ],
  },
  // ===== Finance Module =====
  finance_workbench: {
    pageId: "finance-workbench",
    pageTitle: "财务分析工作台",
    module: "finance",
    summary: "财务分析总入口，支持自然语言查询、KPI概览、风险识别和AI解释。",
    actions: [
      { id: "analyze-receivables", label: "分析应收风险" },
      { id: "forecast-cashflow", label: "预测现金流" },
      { id: "detect-anomalies", label: "检测发票异常" },
      { id: "draft-report", label: "生成分析报告" },
    ],
  },
  finance_receivables: {
    pageId: "finance-receivables",
    pageTitle: "应收风险分析",
    module: "finance",
    summary: "客户维度应收账款风险识别与分析。",
    actions: [
      { id: "summarize-risks", label: "总结风险" },
      { id: "collection-advice", label: "生成催收建议" },
    ],
  },
  finance_forecast: {
    pageId: "finance-forecast",
    pageTitle: "现金流预测",
    module: "finance",
    summary: "现金流趋势预测与缺口分析。",
    actions: [
      { id: "adjust-assumptions", label: "调整假设" },
      { id: "forecast-report", label: "生成预测报告" },
    ],
  },
  finance_anomalies: {
    pageId: "finance-anomalies",
    pageTitle: "发票异常识别",
    module: "finance",
    summary: "发票与费用报销异常检测与处理。",
    actions: [
      { id: "batch-process", label: "批量处理" },
      { id: "anomaly-report", label: "生成异常报告" },
    ],
  },
  finance_reports: {
    pageId: "finance-reports",
    pageTitle: "报告中心",
    module: "finance",
    summary: "分析报告管理与审批。",
    actions: [
      { id: "create-report", label: "新建报告" },
      { id: "submit-approval", label: "提交审批" },
    ],
  },
  finance_approvals: {
    pageId: "finance-approvals",
    pageTitle: "审批审计",
    module: "finance",
    summary: "审批队列与审计轨迹管理。",
    actions: [
      { id: "batch-approve", label: "批量审批" },
      { id: "export-audit", label: "导出审计日志" },
    ],
  },
  // ===== Hermes Module =====
  hermes_dashboard: {
    pageId: "hermes-dashboard",
    pageTitle: "Hermes Dashboard",
    module: "hermes",
    summary: "Hermes 工作空间概览，包含会话、技能、模型和运行状态。",
    actions: [
      { id: "summarize-metrics", label: "总结指标" },
      { id: "check-health", label: "检查健康状态" },
      { id: "list-recent-sessions", label: "列出最近会话" },
    ],
  },
  hermes_sessions: {
    pageId: "hermes-sessions",
    pageTitle: "Hermes 会话管理",
    module: "hermes",
    summary: "查看和管理 Hermes AI 会话。",
    actions: [
      { id: "filter-sessions", label: "筛选会话" },
      { id: "summarize-sessions", label: "总结会话状态" },
    ],
  },
  hermes_skills: {
    pageId: "hermes-skills",
    pageTitle: "Hermes 技能管理",
    module: "hermes",
    summary: "查看和管理 Hermes 技能（内置/工作空间/用户）。",
    actions: [
      { id: "reload-skills", label: "重载技能" },
      { id: "list-enabled", label: "列出已启用技能" },
    ],
  },
  hermes_settings: {
    pageId: "hermes-settings",
    pageTitle: "Hermes 设置",
    module: "hermes",
    summary: "Hermes 网关健康、模型配置和运行时设置。",
    actions: [
      { id: "check-gateway", label: "检查网关" },
      { id: "list-models", label: "列出模型" },
    ],
  },
};
