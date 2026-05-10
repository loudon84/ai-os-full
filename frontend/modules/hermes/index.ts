// Hermes Module - Unified Exports

// Types
export * from "./types/hermes.types";
export * from "./types/hermes.contracts";

// Copilot Types
export * from "./copilot/types";

// Agent Router
export * from "./copilot/agent-router";

// Shared Components
export { HermesMetricCard } from "./components/shared/HermesMetricCard";
export { HealthStatusBadge } from "./components/shared/HealthStatusBadge";
export { HermesErrorState } from "./components/shared/HermesErrorState";
export { HermesEmptyState } from "./components/shared/HermesEmptyState";
export { HermesLoadingState } from "./components/shared/HermesLoadingState";

// Layout Components
export { HermesModuleShell } from "./components/layout/HermesModuleShell";

// Copilot Components
export { HermesCopilotPanel } from "./components/copilot/hermes-copilot-panel";
export { HermesAgentSwitcher } from "./components/copilot/hermes-agent-switcher";
export { HermesMessageRenderer } from "./components/copilot/hermes-message-renderer";
export { HermesToolRenderer } from "./components/copilot/hermes-tool-renderer";
export { StreamStatusBar } from "./components/copilot/stream-status-bar";

// Tool UI Components
export { FinanceAnalysisCard } from "./components/copilot/tool-ui/finance-analysis-card";
export { RiskAlertCard } from "./components/copilot/tool-ui/risk-alert-card";
export { ForecastCard } from "./components/copilot/tool-ui/forecast-card";
export { JsonResultCard } from "./components/copilot/tool-ui/json-result-card";
export { PlainToolResult } from "./components/copilot/tool-ui/plain-tool-result";

// Copilot Hooks
export { useHermesCopilot } from "./hooks/use-hermes-copilot";
export { useActiveHermesAgent } from "./hooks/use-active-hermes-agent";
export { useToolRenderModel } from "./hooks/use-tool-render-model";

// Copilot Frontend Tools
export { useHermesFrontendTools } from "./copilot/frontend-tools";

// Stores
export { useHermesAgentStore } from "./stores/hermes-agent-store";
export { useHermesToolUiStore } from "./stores/hermes-tool-ui-store";

// Pages
export { default as HermesDashboardPage } from "./pages/HermesDashboardPage";
export { default as HermesSessionsPage } from "./pages/HermesSessionsPage";
export { default as HermesSkillsPage } from "./pages/HermesSkillsPage";
export { default as HermesSettingsPage } from "./pages/HermesSettingsPage";
