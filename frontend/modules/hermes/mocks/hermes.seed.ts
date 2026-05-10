import type {
  HermesMetrics,
  HermesActivityPoint,
  HermesSession,
  HermesSkill,
  HermesModel,
  HermesHealth,
  HermesMemory,
  HermesConfig,
} from "../types/hermes.types";

// ===== Metrics =====
export const seedMetrics: HermesMetrics = {
  sessions: 50,
  messages: 945,
  toolCalls: 367,
  totalPromptTokens: 6_900_000,
  totalCompletionTokens: 4_800_000,
  totalCostUsd: 58.25,
  activeModel: "ark-code-latest",
  updatedAt: "2026-04-18T15:00:00Z",
};

// ===== Activity (14 days) =====
export const seedActivityPoints: HermesActivityPoint[] = Array.from({ length: 14 }, (_, i) => {
  const date = new Date(2026, 3, 5 + i); // 2026-04-05 ~ 2026-04-18
  return {
    date: date.toISOString().slice(0, 10),
    messages: Math.floor(Math.random() * 30) + 10,
    toolCalls: Math.floor(Math.random() * 15) + 3,
    sessions: Math.floor(Math.random() * 5) + 1,
  };
});

// ===== Sessions =====
export const seedSessions: HermesSession[] = [
  { id: "sess_001", title: "讨论音乐创作与工作室问题", preview: "继续分析技能装配与工具调用链...", status: "done", messageCount: 7, toolCallCount: 1, totalTokens: 40300, updatedAt: "2026-04-18T14:20:00Z" },
  { id: "sess_002", title: "代码审查与重构建议", preview: "分析项目结构并提出优化方案...", status: "done", messageCount: 12, toolCallCount: 3, totalTokens: 85200, updatedAt: "2026-04-18T12:15:00Z" },
  { id: "sess_003", title: "API 接口设计讨论", preview: "设计 RESTful API 契约层...", status: "running", messageCount: 5, toolCallCount: 2, totalTokens: 32100, updatedAt: "2026-04-18T11:30:00Z" },
  { id: "sess_004", title: "数据库迁移方案", preview: "评估 PostgreSQL 迁移路径...", status: "idle", messageCount: 3, toolCallCount: 0, totalTokens: 15800, updatedAt: "2026-04-17T18:45:00Z" },
  { id: "sess_005", title: "前端性能优化", preview: "分析 Bundle 大小与渲染瓶颈...", status: "done", messageCount: 9, toolCallCount: 4, totalTokens: 62400, updatedAt: "2026-04-17T16:20:00Z" },
  { id: "sess_006", title: "安全审计报告", preview: "检查 OWASP Top 10 合规性...", status: "error", messageCount: 4, toolCallCount: 1, totalTokens: 28700, updatedAt: "2026-04-17T14:10:00Z" },
  { id: "sess_007", title: "微服务架构设计", preview: "拆分单体应用为独立服务...", status: "done", messageCount: 15, toolCallCount: 6, totalTokens: 112000, updatedAt: "2026-04-16T20:30:00Z" },
  { id: "sess_008", title: "CI/CD 流水线配置", preview: "配置 GitHub Actions 自动部署...", status: "done", messageCount: 8, toolCallCount: 2, totalTokens: 45600, updatedAt: "2026-04-16T15:45:00Z" },
  { id: "sess_009", title: "用户认证流程", preview: "实现 OAuth2 + JWT 认证链路...", status: "idle", messageCount: 2, toolCallCount: 0, totalTokens: 9800, updatedAt: "2026-04-15T10:00:00Z" },
  { id: "sess_010", title: "文档生成自动化", preview: "使用 AI 自动生成 API 文档...", status: "done", messageCount: 6, toolCallCount: 3, totalTokens: 38900, updatedAt: "2026-04-15T08:30:00Z" },
];

// ===== Skills =====
export const seedSkills: HermesSkill[] = [
  { name: "arxiv", description: "Search academic papers from arXiv", path: "~/.hermes/skills/arxiv", enabled: true, source: "user", updatedAt: "2026-04-16T12:00:00Z" },
  { name: "apple-notes", description: "Read and search Apple Notes", path: "~/.hermes/skills/apple-notes", enabled: true, source: "user", updatedAt: "2026-04-15T09:00:00Z" },
  { name: "web-search", description: "Search the web for information", enabled: true, source: "builtin", updatedAt: "2026-04-10T00:00:00Z" },
  { name: "code-analysis", description: "Analyze code structure and quality", enabled: true, source: "builtin", updatedAt: "2026-04-10T00:00:00Z" },
  { name: "file-ops", description: "File system operations", enabled: true, source: "builtin" },
  { name: "custom-report", description: "Generate custom reports", path: "./skills/custom-report", enabled: false, source: "workspace", updatedAt: "2026-04-12T14:00:00Z" },
];

// ===== Models =====
export const seedModels: HermesModel[] = [
  { provider: "custom", model: "ark-code-latest", endpoint: "https://ark.cn-beijing.volces.com/v1", isDefault: true, supportsTools: true, supportsThinking: false, supportsVision: false, health: "healthy" },
  { provider: "openai", model: "gpt-4o", isDefault: false, supportsTools: true, supportsThinking: false, supportsVision: true, health: "healthy" },
  { provider: "anthropic", model: "claude-3-sonnet", isDefault: false, supportsTools: true, supportsThinking: true, supportsVision: true, health: "degraded" },
];

// ===== Health =====
export const seedHealth: HermesHealth = {
  status: "healthy",
  gateway: { reachable: true, latencyMs: 42, version: "0.1.0" },
  model: { reachable: true, provider: "custom", model: "ark-code-latest" },
  memory: { enabled: true, provider: "file" },
  updatedAt: "2026-04-18T15:00:00Z",
};

// ===== Memory =====
export const seedMemory: HermesMemory = {
  enabled: true,
  provider: "file",
  entryCount: 37,
  updatedAt: "2026-04-18T14:58:00Z",
};

// ===== Config =====
export const seedConfig: HermesConfig = {
  activeModel: "ark-code-latest",
  provider: "custom",
  skillsEnabled: 5,
  skillsTotal: 6,
  memoryEnabled: true,
};
