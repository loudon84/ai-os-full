# Paperclip Project Semantic Overview

## Purpose

Paperclip is the **control plane for autonomous AI companies** — not an agent runtime, not a task manager, not a SaaS. It is the operating layer that makes AI workforces governable: org charts, task assignment, budget enforcement, approval workflows, and execution orchestration. Agents run externally and phone home; Paperclip decides when, what, and whether they run. [1](#0-0) [2](#0-1) 

---

## Core Architecture

**Three-tier monolith with an out-of-process plugin layer:**

- **Control plane** (`server/src/`): Express REST API + in-process background services. Single Node.js process. Entry: `startServer()` in `server/src/index.ts`.
- **Board UI** (`ui/src/`): React + React Query SPA. Operator-only. Communicates via REST + WebSocket.
- **Data layer** (`packages/db/`): PostgreSQL via Drizzle ORM. All business entities are `companyId`-scoped. Embedded PostgreSQL for local dev.
- **Plugin workers**: Out-of-process Node.js children, JSON-RPC 2.0 over stdin/stdout. Isolated from host memory and DB handles except through capability-gated RPC. [3](#0-2) [4](#0-3) 

---

## Key Modules

- `server/src/services/heartbeat.ts` — The largest and most critical service. Owns the entire agent execution lifecycle: wakeup queue, run executor, process management, orphan recovery, budget checks, session state, log streaming, and plugin event emission. Do not modify without understanding all state transitions.
- `server/src/services/plugin-loader.ts` — Discovers, validates, migrates, and activates plugins. Manages worker process lifecycle and hot reload.
- `server/src/adapters/registry.ts` — Maps `adapterType` strings to `ServerAdapterModule` implementations. The seam between the control plane and agent execution.
- `server/src/middleware/board-mutation-guard.ts` — CSRF-equivalent guard: blocks board-session mutations without a trusted browser origin.
- `server/src/routes/authz.ts` — `assertCompanyAccess`, `assertBoard`, `assertInstanceAdmin` — the authorization primitives called at every route boundary.
- `packages/shared/src/constants.ts` — Canonical enums for all status machines: `HEARTBEAT_RUN_STATUSES`, `WAKEUP_REQUEST_STATUSES`, `AGENT_STATUSES`, adapter types, org roles. Source of truth for state machine shapes.
- `packages/shared/src/types/` — Shared TypeScript interfaces for all domain entities. Consumed by both server and UI.
- `packages/adapter-utils/src/types.ts` — `ServerAdapterModule` interface. The stable contract every adapter (built-in or external) must implement.
- `packages/plugins/sdk/src/` — `@paperclipai/plugin-sdk`. The only surface plugin authors should touch.
- `packages/db/src/schema/` — Drizzle table definitions. Core tables: `companies`, `agents`, `issues`, `heartbeatRuns`, `agentWakeupRequests`, `costEvents`, `approvals`, `executionWorkspaces`. [5](#0-4) [6](#0-5) [7](#0-6) 

---

## Lifecycle

1. **`startServer()`** — loads env/config, initializes DB connection (embedded or external), runs `applyPendingMigrations`.
2. **`createApp()`** — mounts all Express routes under `/api`, applies `actorMiddleware` (resolves identity), `boardMutationGuard`, `privateHostnameGuard`.
3. **Plugin bootstrap** — `createPluginWorkerManager` → `pluginLoader` scans local plugin dir, validates manifests, runs plugin migrations, spawns worker processes, registers tools/webhooks/event subscriptions.
4. **`heartbeatService` start** — begins scheduler tick loop: claims queued wakeup requests, executes runs, monitors orphaned processes.
5. **`routineService` start** — evaluates cron schedules, enqueues wakeup requests for due routines.
6. **`setupLiveEventsWebSocketServer`** — WebSocket server for company-scoped real-time push to the board UI.
7. **Run loop** — `heartbeatService` continuously: dequeue → execute adapter → stream logs → finalize run → release issue lock → emit plugin events → update agent status. [8](#0-7) [9](#0-8) 

---

## Extension Points

**Adding a new agent adapter** — implement `ServerAdapterModule` from `packages/adapter-utils/src/types.ts` (`execute`, `testEnvironment`, `sessionCodec`). Register in `server/src/adapters/registry.ts`. Add a matching UI adapter in `ui/src/adapters/registry.ts`. External adapters can be loaded as plugins without modifying core. [6](#0-5) 

**Adding a plugin** — implement `definePlugin` from `@paperclipai/plugin-sdk`, declare a `PaperclipPluginManifestV1` with required capabilities. Plugin gets: `ctx.events.on()` for domain events, `ctx.jobs.register()` for scheduled jobs, `ctx.tools.register()` for agent-callable tools, `ctx.state` for persistent KV, and UI slots (`page`, `sidebar`, `detailTab`, `dashboardWidget`, `globalToolbarButton`, `commentAnnotation`). [10](#0-9) [11](#0-10) 

**Plugin event hooks** — subscribe to any domain event listed in `packages/plugins/sdk/README.md` lines 117–131. Hooks are post-commit and fire-and-forget; a failing handler never blocks the core operation. Plugins cannot veto or intercept core mutations. [12](#0-11) 

**New core routes** — add a route file in `server/src/routes/`, mount it in `createApp()` in `server/src/app.ts`. All routes must call `assertCompanyAccess` (or stronger) before touching any entity.

**UI extension without a plugin** — add pages/components under `ui/src/`. Plugin UI slots are the preferred path for optional features.

---

## Constraints and Invariants

**Company boundary is absolute.** Every entity fetch and mutation must call `assertCompanyAccess`. Agents cannot cross company boundaries via their API key. Violating this is a security regression. [13](#0-12) [14](#0-13) 

**Single assignee + atomic checkout.** An issue can only be `in_progress` with one agent holding the execution lock (`executionRunId`, `executionLockedAt`). The checkout is transactional. Breaking this causes double-work and lost context. [15](#0-14) 

**Budget hard-stops are non-negotiable.** When an agent crosses its budget ceiling, the system auto-pauses it and cancels queued work. Plugins can observe `budget.incident.opened` but cannot suppress the enforcement. [16](#0-15) 

**Board governs high-impact decisions.** Agent hiring, CEO strategy approval, and company-level mutations require board actor type. Agents (even CEOs) have a narrower write surface. [17](#0-16) 

**All mutations are traced.** Every mutating route calls `logActivity`. The activity log is append-only and must not be bypassed.

**Plugins extend, never patch.** Plugins cannot override core routes, modify core tables, intercept approval decisions, rewrite budget logic, or shadow auth behaviors. Plugin tables are prefixed `mod_<id>_` or use `plugin_state`/`plugin_entities`. Core never imports from plugin packages. [18](#0-17) [19](#0-18) 

**Plugin workers are isolated.** A crashing plugin worker must not crash the host server. The JSON-RPC boundary is the isolation contract. Do not move plugin logic in-process.

**Deployment mode is a first-class concern.** `local_trusted` vs `authenticated` affects auth, binding, and CSRF behavior throughout the stack. New routes must handle both modes correctly via `actorMiddleware` and `boardMutationGuard`. [20](#0-19) 

**Adapter execution is runtime-agnostic.** The control plane does not know or care what the agent does during a run. It only controls when to invoke, what context to pass, and when to cancel. Do not embed agent-specific logic in core services. [21](#0-20) 

---

## What This System Is Not

- Not an agent runtime — agents execute externally.
- Not a knowledge base — no vector DB, no wiki (plugin territory).
- Not a SaaS — single-tenant, self-hosted, one operator per instance.
- Not automatically self-healing — surfaces failures visibly, does not silently reassign or retry beyond defined policies.
- Not a delivery infrastructure manager — no repo management, no deployment pipelines. [22](#0-21)

### Citations

**File:** doc/GOAL.md (L9-9)
```markdown
Paperclip is not the company. Paperclip is what makes the companies possible. We are the control plane, the nervous system, the operating layer. Every autonomous company needs structure, task management, cost control, goal alignment, and human governance. That's us. We are to autonomous companies what the corporate operating system is to human ones — except this time, the operating system is real software, not metaphor.
```

**File:** doc/GOAL.md (L54-54)
```markdown
The control plane doesn't run agents. It orchestrates them. Agents run wherever they run and phone home.
```

**File:** doc/SPEC.md (L508-518)
```markdown
Things Paperclip explicitly does **not** do:

- **Not an Agent runtime** — Paperclip orchestrates, Agents run elsewhere
- **Not a knowledge base** — core has no wiki/docs/vector-DB (plugin territory)
- **Not a SaaS** — single-tenant, self-hosted
- **Not opinionated about Agent implementation** — any language, any framework, any runtime
- **Not automatically self-healing** — surfaces problems, doesn't silently fix them
- **Does not manage delivery infrastructure** — no repo management, no deployment, no file systems (but does manage task-linked documents and attachments)
- **Does not auto-reassign work** — stale tasks are surfaced, not silently redistributed
- **Does not track external revenue/expenses** — that's a future plugin. Token/LLM cost budgeting is core.

```

**File:** server/src/app.ts (L1-61)
```typescript
import express, { Router, type Request as ExpressRequest } from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import type { Db } from "@paperclipai/db";
import type { DeploymentExposure, DeploymentMode } from "@paperclipai/shared";
import type { StorageService } from "./storage/types.js";
import { httpLogger, errorHandler } from "./middleware/index.js";
import { actorMiddleware } from "./middleware/auth.js";
import { boardMutationGuard } from "./middleware/board-mutation-guard.js";
import { privateHostnameGuard, resolvePrivateHostnameAllowSet } from "./middleware/private-hostname-guard.js";
import { healthRoutes } from "./routes/health.js";
import { companyRoutes } from "./routes/companies.js";
import { companySkillRoutes } from "./routes/company-skills.js";
import { agentRoutes } from "./routes/agents.js";
import { projectRoutes } from "./routes/projects.js";
import { issueRoutes } from "./routes/issues.js";
import { issueTreeControlRoutes } from "./routes/issue-tree-control.js";
import { routineRoutes } from "./routes/routines.js";
import { environmentRoutes } from "./routes/environments.js";
import { executionWorkspaceRoutes } from "./routes/execution-workspaces.js";
import { goalRoutes } from "./routes/goals.js";
import { approvalRoutes } from "./routes/approvals.js";
import { secretRoutes } from "./routes/secrets.js";
import { costRoutes } from "./routes/costs.js";
import { activityRoutes } from "./routes/activity.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { userProfileRoutes } from "./routes/user-profiles.js";
import { sidebarBadgeRoutes } from "./routes/sidebar-badges.js";
import { sidebarPreferenceRoutes } from "./routes/sidebar-preferences.js";
import { inboxDismissalRoutes } from "./routes/inbox-dismissals.js";
import { instanceSettingsRoutes } from "./routes/instance-settings.js";
import {
  instanceDatabaseBackupRoutes,
  type InstanceDatabaseBackupService,
} from "./routes/instance-database-backups.js";
import { llmRoutes } from "./routes/llms.js";
import { authRoutes } from "./routes/auth.js";
import { assetRoutes } from "./routes/assets.js";
import { accessRoutes } from "./routes/access.js";
import { pluginRoutes } from "./routes/plugins.js";
import { adapterRoutes } from "./routes/adapters.js";
import { pluginUiStaticRoutes } from "./routes/plugin-ui-static.js";
import { applyUiBranding } from "./ui-branding.js";
import { logger } from "./middleware/logger.js";
import { DEFAULT_LOCAL_PLUGIN_DIR, pluginLoader } from "./services/plugin-loader.js";
import { createPluginWorkerManager, type PluginWorkerManager } from "./services/plugin-worker-manager.js";
import { createPluginJobScheduler } from "./services/plugin-job-scheduler.js";
import { pluginJobStore } from "./services/plugin-job-store.js";
import { createPluginToolDispatcher } from "./services/plugin-tool-dispatcher.js";
import { pluginLifecycleManager } from "./services/plugin-lifecycle.js";
import { createPluginJobCoordinator } from "./services/plugin-job-coordinator.js";
import { buildHostServices, flushPluginLogBuffer } from "./services/plugin-host-services.js";
import { createPluginEventBus } from "./services/plugin-event-bus.js";
import { setPluginEventBus } from "./services/activity-log.js";
import { createPluginDevWatcher } from "./services/plugin-dev-watcher.js";
import { createPluginHostServiceCleanup } from "./services/plugin-host-service-cleanup.js";
import { pluginRegistryService } from "./services/plugin-registry.js";
import { createHostClientHandlers } from "@paperclipai/plugin-sdk";
import type { BetterAuthSessionResult } from "./auth/better-auth.js";
import { createCachedViteHtmlRenderer } from "./vite-html-renderer.js";
```

**File:** server/src/app.ts (L169-232)
```typescript
  app.use("/api/auth", authRoutes(db));
  if (opts.betterAuthHandler) {
    app.all("/api/auth/{*authPath}", opts.betterAuthHandler);
  }
  app.use(llmRoutes(db));

  const hostServicesDisposers = new Map<string, () => void>();
  const workerManager = opts.pluginWorkerManager ?? createPluginWorkerManager();

  // Mount API routes
  const api = Router();
  api.use(boardMutationGuard());
  api.use(
    "/health",
    healthRoutes(db, {
      deploymentMode: opts.deploymentMode,
      deploymentExposure: opts.deploymentExposure,
      authReady: opts.authReady,
      companyDeletionEnabled: opts.companyDeletionEnabled,
    }),
  );
  api.use("/companies", companyRoutes(db, opts.storageService));
  api.use(companySkillRoutes(db));
  api.use(agentRoutes(db, { pluginWorkerManager: workerManager }));
  api.use(assetRoutes(db, opts.storageService));
  api.use(projectRoutes(db));
  api.use(issueRoutes(db, opts.storageService, {
    feedbackExportService: opts.feedbackExportService,
    pluginWorkerManager: workerManager,
  }));
  api.use(issueTreeControlRoutes(db));
  api.use(routineRoutes(db, { pluginWorkerManager: workerManager }));
  api.use(environmentRoutes(db, { pluginWorkerManager: workerManager }));
  api.use(executionWorkspaceRoutes(db));
  api.use(goalRoutes(db));
  api.use(approvalRoutes(db, { pluginWorkerManager: workerManager }));
  api.use(secretRoutes(db));
  api.use(costRoutes(db, { pluginWorkerManager: workerManager }));
  api.use(activityRoutes(db));
  api.use(dashboardRoutes(db));
  api.use(userProfileRoutes(db));
  api.use(sidebarBadgeRoutes(db));
  api.use(sidebarPreferenceRoutes(db));
  api.use(inboxDismissalRoutes(db));
  api.use(instanceSettingsRoutes(db));
  if (opts.databaseBackupService) {
    api.use(instanceDatabaseBackupRoutes(opts.databaseBackupService));
  }
  const pluginRegistry = pluginRegistryService(db);
  const eventBus = createPluginEventBus();
  setPluginEventBus(eventBus);
  const jobStore = pluginJobStore(db);
  const lifecycle = pluginLifecycleManager(db, { workerManager });
  const scheduler = createPluginJobScheduler({
    db,
    jobStore,
    workerManager,
  });
  const toolDispatcher = createPluginToolDispatcher({
    workerManager,
    lifecycleManager: lifecycle,
    db,
  });
  const jobCoordinator = createPluginJobCoordinator({
```

**File:** doc/SPEC-implementation.md (L39-39)
```markdown
| Task ownership | Single assignee; atomic checkout required for `in_progress` transition |
```

**File:** doc/SPEC-implementation.md (L44-45)
```markdown
| Budget period | Monthly UTC calendar window |
| Budget enforcement | Soft alerts + hard limit auto-pause |
```

**File:** doc/SPEC-implementation.md (L86-101)
```markdown
## 6.1 Runtime Components

- `server/`: REST API, auth, orchestration services
- `ui/`: Board operator interface
- `packages/db/`: Drizzle schema, migrations, DB clients (Postgres)
- `packages/shared/`: Shared API types, validators, constants

## 6.2 Data Stores

- Primary: PostgreSQL
- Local default: embedded PostgreSQL at `~/.paperclip/instances/default/db`
- Optional local prod-like: Docker Postgres
- Optional hosted: Supabase/Postgres-compatible
- File/object storage:
  - local default: `~/.paperclip/instances/default/data/storage` (`local_disk`)
  - cloud: S3-compatible object storage (`s3`)
```

**File:** doc/SPEC-implementation.md (L811-815)
```markdown
- store only hashed agent API keys
- redact secrets in logs (`adapter_config`, auth headers, env vars)
- CSRF protection for board session endpoints
- rate limit auth and key-management endpoints
- strict company boundary checks on every entity fetch/mutation
```

**File:** server/src/services/heartbeat.ts (L149-176)
```typescript
const MAX_LIVE_LOG_CHUNK_BYTES = 8 * 1024;
const MAX_PERSISTED_LOG_CHUNK_CHARS = 64 * 1024;
const MAX_RUN_EVENT_PAYLOAD_STRING_CHARS = 16 * 1024;
const MAX_RUN_EVENT_PAYLOAD_ARRAY_ITEMS = 50;
const MAX_RUN_EVENT_PAYLOAD_OBJECT_KEYS = 100;
const MAX_RUN_EVENT_PAYLOAD_DEPTH = 6;
const HEARTBEAT_MAX_CONCURRENT_RUNS_DEFAULT = AGENT_DEFAULT_MAX_CONCURRENT_RUNS;
const HEARTBEAT_MAX_CONCURRENT_RUNS_MIN = 1;
const HEARTBEAT_MAX_CONCURRENT_RUNS_MAX = 50;
const LIVENESS_BOOKKEEPING_ACTIVITY_ACTIONS = [
  "environment.lease_acquired",
  "environment.lease_released",
];
const DEFERRED_WAKE_CONTEXT_KEY = "_paperclipWakeContext";
const WAKE_COMMENT_IDS_KEY = "wakeCommentIds";
const PAPERCLIP_WAKE_PAYLOAD_KEY = "paperclipWake";
const PAPERCLIP_HARNESS_CHECKOUT_KEY = "paperclipHarnessCheckedOut";
const DETACHED_PROCESS_ERROR_CODE = "process_detached";
const REPO_ONLY_CWD_SENTINEL = "/__paperclip_repo_only__";
const MANAGED_WORKSPACE_GIT_CLONE_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_INLINE_WAKE_COMMENTS = 8;
const MAX_INLINE_WAKE_COMMENT_BODY_CHARS = 4_000;
const MAX_INLINE_WAKE_COMMENT_BODY_TOTAL_CHARS = 12_000;
const execFile = promisify(execFileCallback);
const EXECUTION_PATH_HEARTBEAT_RUN_STATUSES = ["queued", "running", "scheduled_retry"] as const;
const CANCELLABLE_HEARTBEAT_RUN_STATUSES = ["queued", "running", "scheduled_retry"] as const;
const HEARTBEAT_RUN_TERMINAL_STATUSES = ["succeeded", "failed", "cancelled", "timed_out"] as const;
const UNSUCCESSFUL_HEARTBEAT_RUN_TERMINAL_STATUSES = ["failed", "cancelled", "timed_out"] as const;
```

**File:** packages/adapter-utils/src/types.ts (L122-140)
```typescript
export interface AdapterExecutionContext {
  runId: string;
  agent: AdapterAgent;
  runtime: AdapterRuntime;
  config: Record<string, unknown>;
  context: Record<string, unknown>;
  runtimeCommandSpec?: AdapterRuntimeCommandSpec | null;
  executionTarget?: AdapterExecutionTarget | null;
  /**
   * Legacy remote transport view. Prefer `executionTarget`, which is the
   * provider-neutral contract produced by core runtime code.
   */
  executionTransport?: {
    remoteExecution?: Record<string, unknown> | null;
  };
  onLog: (stream: "stdout" | "stderr", chunk: string) => Promise<void>;
  onMeta?: (meta: AdapterInvocationMeta) => Promise<void>;
  onSpawn?: (meta: { pid: number; processGroupId: number | null; startedAt: string }) => Promise<void>;
  authToken?: string;
```

**File:** packages/shared/src/constants.ts (L458-479)
```typescript
export const WAKEUP_REQUEST_STATUSES = [
  "queued",
  "deferred_issue_execution",
  "claimed",
  "coalesced",
  "skipped",
  "completed",
  "failed",
  "cancelled",
] as const;
export type WakeupRequestStatus = (typeof WAKEUP_REQUEST_STATUSES)[number];

export const HEARTBEAT_RUN_STATUSES = [
  "queued",
  "scheduled_retry",
  "running",
  "succeeded",
  "failed",
  "cancelled",
  "timed_out",
] as const;
export type HeartbeatRunStatus = (typeof HEARTBEAT_RUN_STATUSES)[number];
```

**File:** server/src/index.ts (L906-923)
```typescript
}

function isMainModule(metaUrl: string): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return pathToFileURL(resolve(entry)).href === metaUrl;
  } catch {
    return false;
  }
}

if (isMainModule(import.meta.url)) {
  void startServer().catch((err) => {
    logger.error({ err }, "Paperclip server failed to start");
    process.exit(1);
  });
}
```

**File:** packages/plugins/sdk/README.md (L92-103)
```markdown
**Lifecycle (definePlugin):**

| Hook | Purpose |
|------|--------|
| `setup(ctx)` | **Required.** Called once at startup. Register event handlers, jobs, data/actions/tools, etc. |
| `onHealth?()` | Optional. Return `{ status, message?, details? }` for health dashboard. |
| `onConfigChanged?(newConfig)` | Optional. Apply new config without restart; if omitted, host restarts worker. |
| `onShutdown?()` | Optional. Clean up before process exit (limited time window). |
| `onValidateConfig?(config)` | Optional. Return `{ ok, warnings?, errors? }` for settings UI / Test Connection. |
| `onWebhook?(input)` | Optional. Handle `POST /api/plugins/:pluginId/webhooks/:endpointKey`; required if webhooks declared. |

**Context (`ctx`) in setup:** `config`, `localFolders`, `events`, `jobs`, `launchers`, `http`, `secrets`, `activity`, `state`, `entities`, `projects`, `companies`, `issues`, `agents`, `goals`, `data`, `actions`, `streams`, `tools`, `metrics`, `logger`, `manifest`. Worker-side host APIs are capability-gated; declare capabilities in the manifest.
```

**File:** server/src/services/plugin-loader.ts (L1861-1914)
```typescript
      //
      // Note: Event subscriptions are declared at runtime by the plugin
      // worker via the SDK's ctx.events.on() calls. The event bus manages
      // per-plugin subscription scoping. Here we ensure the event bus has
      // a scoped handle ready for this plugin — the actual subscriptions
      // are registered by the host handler layer when the worker calls
      // events.subscribe via RPC.
      //
      // The bus.forPlugin() call creates the scoped handle if needed;
      // any previous subscriptions for this plugin are preserved if the
      // worker is restarting.
      // ------------------------------------------------------------------
      const _scopedBus = eventBus.forPlugin(pluginKey);
      registered.eventSubscriptions = eventBus.subscriptionCount(pluginKey);

      log.debug(
        { pluginId, pluginKey },
        "plugin-loader: event bus scoped handle ready",
      );

      // ------------------------------------------------------------------
      // 7. Register webhook endpoints (manifest-declared)
      //
      // Webhooks are statically declared in the manifest. The actual
      // endpoint routing is handled by the plugin routes module which
      // checks the manifest for declared webhooks. No explicit
      // registration step is needed here — the manifest is persisted
      // in the DB and the route handler reads it at request time.
      //
      // We track the count for the result reporting.
      // ------------------------------------------------------------------
      const webhookDeclarations = manifest.webhooks ?? [];
      registered.webhooks = webhookDeclarations.length;

      if (webhookDeclarations.length > 0) {
        log.info(
          { pluginId, pluginKey, webhooks: webhookDeclarations.length },
          "plugin-loader: webhook endpoints declared in manifest",
        );
      }

      // ------------------------------------------------------------------
      // 8. Register agent tools
      // ------------------------------------------------------------------
      const toolDeclarations = manifest.tools ?? [];
      if (toolDeclarations.length > 0) {
        toolDispatcher.registerPluginTools(pluginKey, manifest);
        registered.tools = toolDeclarations.length;

        log.info(
          { pluginId, pluginKey, tools: toolDeclarations.length },
          "plugin-loader: agent tools registered",
        );
      }
```

**File:** doc/plans/2026-02-16-module-system.md (L229-235)
```markdown
Design rules:
- **Hooks are fire-and-forget.** A failing hook handler never crashes or blocks the core operation.
- **Hooks are concurrent.** All handlers for an event run in parallel via `Promise.allSettled`.
- **Hooks are post-commit.** They fire after the database write succeeds, not before. No vetoing.
- **Hooks receive immutable snapshots.** Handlers get a copy of the data, not a mutable reference.

This keeps the core fast and resilient. If you need pre-commit validation (e.g., "reject this budget change"), that's a different mechanism (middleware/interceptor) we can add later if needed.
```

**File:** doc/plans/2026-02-16-module-system.md (L675-687)
```markdown
1. **Modules extend, never patch.** Modules add new routes, tables, and hook handlers. They never modify core tables or override core routes.

2. **Hooks are post-commit, fire-and-forget.** Module failures never break core operations.

3. **One-way dependency.** Modules depend on core. Core never depends on modules. Module tables can FK to core tables, not the reverse.

4. **Declarative manifest, imperative registration.** Static metadata in JSON (validated without running code). Runtime behavior registered via the API.

5. **Namespace isolation.** Module routes live under `/api/modules/<id>/`. Module tables are prefixed `mod_<id>_`. Module config is scoped to its ID.

6. **Graceful degradation.** If a module fails to load, log the error and continue. The rest of the system works fine.

7. **Data survives disable.** Disabling a module stops its code but preserves its data. Re-enabling picks up where it left off.
```

**File:** server/src/routes/authz.ts (L42-64)
```typescript
export function assertCompanyAccess(req: Request, companyId: string) {
  assertAuthenticated(req);
  if (req.actor.type === "agent" && req.actor.companyId !== companyId) {
    throw forbidden("Agent key cannot access another company");
  }
  if (req.actor.type === "board" && req.actor.source !== "local_implicit") {
    const allowedCompanies = req.actor.companyIds ?? [];
    if (!allowedCompanies.includes(companyId)) {
      throw forbidden("User does not have access to this company");
    }
    const method = typeof req.method === "string" ? req.method.toUpperCase() : "GET";
    const isSafeMethod = ["GET", "HEAD", "OPTIONS"].includes(method);
    if (!isSafeMethod && !req.actor.isInstanceAdmin && Array.isArray(req.actor.memberships)) {
      const membership = req.actor.memberships.find((item) => item.companyId === companyId);
      if (!membership || membership.status !== "active") {
        throw forbidden("User does not have active company access");
      }
      if (membership.membershipRole === "viewer") {
        throw forbidden("Viewer access is read-only");
      }
    }
  }
}
```

**File:** server/src/routes/companies.ts (L310-323)
```typescript
    if (req.actor.type === "agent") {
      // Only CEO agents may update company branding fields
      const agentSvc = agentService(db);
      const actorAgent = req.actor.agentId ? await agentSvc.getById(req.actor.agentId) : null;
      if (!actorAgent || actorAgent.role !== "ceo") {
        throw forbidden("Only CEO agents or board users may update company settings");
      }
      if (actorAgent.companyId !== companyId) {
        throw forbidden("Agent key cannot access another company");
      }
      body = updateCompanyBrandingSchema.parse(req.body);
    } else {
      assertBoard(req);
      body = updateCompanySchema.parse(req.body);
```

**File:** doc/plugins/ideas-from-opencode.md (L314-349)
```markdown
## 3. Arbitrary mutation hooks on core business decisions

Hooks like:

- `permission.ask`
- `tool.execute.before`
- `chat.headers`
- `shell.env`

make sense in `opencode`.

For Paperclip, equivalent hooks into:

- approval decisions
- issue checkout semantics
- activity log behavior
- budget enforcement

would be a mistake.

Core invariants should stay in core code, not become hook-rewritable.

## 4. Override-by-name collision

Allowing a plugin to replace a built-in tool by name is useful in a local agent product.

Paperclip should not allow plugins to silently replace:

- core routes
- core mutating actions
- auth behaviors
- permission evaluators
- budget logic
- audit logic

Extension should be additive or explicitly delegated, never accidental shadowing.
```

**File:** server/src/middleware/board-mutation-guard.ts (L47-73)
```typescript
export function boardMutationGuard(): RequestHandler {
  return (req, res, next) => {
    if (SAFE_METHODS.has(req.method.toUpperCase())) {
      next();
      return;
    }

    if (req.actor.type !== "board") {
      next();
      return;
    }

    // Local-trusted mode and board bearer keys are not browser-session requests.
    // In these modes, origin/referer headers can be absent; do not block those mutations.
    if (req.actor.source === "local_implicit" || req.actor.source === "board_key") {
      next();
      return;
    }

    if (!isTrustedBoardMutationRequest(req)) {
      res.status(403).json({ error: "Board mutation requires trusted browser origin" });
      return;
    }

    next();
  };
}
```
