import { createDb } from "@portal/db";
import cors from "cors";
import express, { type Express, type Request, Router } from "express";

import type { AppConfig } from "./config.js";
import { JwtProvider } from "./auth-provider/jwt-provider.js";
import { globalEventBus } from "./events/event-bus.js";
import { logger } from "./middleware/logger.js";
import { DesktopHeartbeatCleanupJob } from "./jobs/desktop-heartbeat-cleanup.job.js";
import { TaskTimeoutScanJob } from "./jobs/task-timeout-scan.job.js";
import { authV2Middleware } from "./middleware/auth-v2.js";
import { errorHandler } from "./middleware/error-handler.js";
import { httpLogger } from "./middleware/logger.js";
import { authRoutes } from "./routes/auth.js";
import { auditRoutes } from "./routes/audit.js";
import { connectorRoutes } from "./routes/connectors.js";
import { desktopSyncRoutes } from "./routes/desktop-sync.js";
import { documentRoutes } from "./routes/documents.js";
import { emailRoutes } from "./routes/email.js";
import { healthRoutes } from "./routes/health.js";
import { permissionsRoutes } from "./routes/permissions.js";
import { serviceCenterMcpRoutes } from "./routes/service-center-mcp.js";
import { serviceCenterPluginRoutes } from "./routes/service-center-plugins.js";
import { serviceCenterProfileRoutes } from "./routes/service-center-profiles.js";
import { serviceCenterSkillRoutes } from "./routes/service-center-skills.js";
import { hermesRoutes } from "./routes/hermes.js";
import { taskReplayRoutes } from "./routes/task-replay.js";
import { teamTaskRoutes } from "./routes/team-tasks.js";
import { userRoutes } from "./routes/users.js";
import { workspaceRoutes } from "./routes/workspaces.js";
import { AuditService } from "./services/audit/audit-service.js";
import { AuthService } from "./services/auth/auth-service.js";
import {
  DocumentRepository,
  DocumentService,
  PermissionService as DocumentPermissionService,
} from "./services/documents/index.js";
import {
  CredentialCryptoService,
  EmailAccountRepository,
  EmailAccountService,
  EmailAttachmentRepository,
  EmailMessageRepository,
  EmailMessageService,
  EmailSyncLogRepository,
  EmailSyncService,
  SmtpSenderService,
} from "./services/email/index.js";
import { MembershipService } from "./services/rbac/membership-service.js";
import { PermissionService } from "./services/rbac/permission-service.js";
import { RoleService } from "./services/rbac/role-service.js";
import { UserService } from "./services/rbac/user-service.js";
import { WorkspaceService } from "./services/rbac/workspace-service.js";
import { ConnectorService } from "./services/service-center/connectors/index.js";
import {
  BootstrapService,
  DesktopClientService,
} from "./services/service-center/desktop-sync/index.js";
import { McpHealthService, McpServerService, McpToolService } from "./services/service-center/mcp/index.js";
import { PluginService } from "./services/service-center/plugins/index.js";
import { ProfileService } from "./services/service-center/profiles/index.js";
import { SkillTemplateService } from "./services/service-center/skills/index.js";
import { TeamTaskService } from "./services/team-tasks/index.js";
import {
  HermesEventService,
  HermesRunService,
  HermesToolCallService,
  PromptTemplateService,
  TaskReplayService,
  ToolFacadeService,
  ContextBuilder,
} from "./services/hermes/index.js";
import { SnapshotStorage } from "./storage/snapshot-storage.js";

export function createApp(config: AppConfig): Express {
  const app = express();

  app.use(cors());
  app.use(
    express.json({
      limit: "32mb",
      verify: (req, _res, buf) => {
        const request = req as Request;
        if (request.originalUrl?.includes("/connectors/webhooks/")) {
          request.rawBody = buf.toString("utf8");
        }
      },
    }),
  );
  app.use(httpLogger);

  app.use("/health", healthRoutes());

  const db = createDb(config.dbUrl);

  const authProvider = new JwtProvider(db, {
    jwtSecret: config.jwtSecret,
    jwtRefreshSecret: config.jwtRefreshSecret,
    jwtAccessExpSec: config.jwtAccessExpSec,
    jwtRefreshExpSec: config.jwtRefreshExpSec,
    refreshTokenMax: config.refreshTokenMax,
  });

  const auditService = new AuditService(db);
  const authService = new AuthService(db, authProvider, config);
  const workspaceService = new WorkspaceService(db);
  const membershipService = new MembershipService(db);
  const roleService = new RoleService(db);
  const permissionService = new PermissionService(db);
  const userService = new UserService(db);

  const api = Router();

  api.use("/auth", authRoutes(authService));

  app.use(authV2Middleware(config, authProvider, db));

  const repo = new DocumentRepository();
  const docPermission = new DocumentPermissionService(repo);
  const storage = new SnapshotStorage(config);
  const docService = new DocumentService({
    db,
    repo,
    storage,
    permission: docPermission,
    config,
  });
  const emailAccountRepo = new EmailAccountRepository();
  const emailMessageRepo = new EmailMessageRepository();
  const emailAttachmentRepo = new EmailAttachmentRepository();
  const emailSyncLogRepo = new EmailSyncLogRepository();
  const emailCrypto = new CredentialCryptoService(
    config.emailCredentialEncryptionKey ?? "0".repeat(64),
  );
  const smtpSender = new SmtpSenderService();
  const emailAccountService = new EmailAccountService(
    db,
    emailAccountRepo,
    emailCrypto,
    smtpSender,
  );
  const emailMessageService = new EmailMessageService(
    db,
    emailAccountService,
    emailMessageRepo,
    emailAttachmentRepo,
    smtpSender,
  );
  const emailSyncService = new EmailSyncService(
    db,
    emailAccountService,
    emailAccountRepo,
    emailMessageRepo,
    emailAttachmentRepo,
    emailSyncLogRepo,
  );

  const desktopClientService = new DesktopClientService(db, auditService);
  const teamTaskService = new TeamTaskService(
    db,
    auditService,
    desktopClientService,
  );
  const profileService = new ProfileService(db, auditService);
  const skillTemplateService = new SkillTemplateService(db, auditService);
  const pluginService = new PluginService(db, auditService);
  const mcpServerService = new McpServerService(db, auditService);
  const mcpToolService = new McpToolService(db, auditService);
  const mcpHealthService = new McpHealthService(db, auditService);
  const bootstrapService = new BootstrapService(
    db,
    config,
    auditService,
    desktopClientService,
    profileService,
    skillTemplateService,
    pluginService,
    mcpServerService,
  );
  const connectorService = new ConnectorService(
    db,
    config,
    auditService,
    teamTaskService,
  );

  const hermesRunService = new HermesRunService(db, config, auditService, {
    contextBuilder: new ContextBuilder({
      documentRepo: repo,
      documentPermission: docPermission,
      emailMessageRepo: emailMessageRepo,
    }),
  });
  const hermesEventService = new HermesEventService();
  const hermesToolCallService = new HermesToolCallService(auditService);
  const toolFacadeService = new ToolFacadeService(hermesToolCallService, {
    documentService: docService,
    documentRepo: repo,
    documentPermission: docPermission,
    emailMessageService: emailMessageService,
    emailMessageRepo: emailMessageRepo,
    teamTaskService,
    auditService,
  });
  const promptTemplateService = new PromptTemplateService();
  const taskReplayService = new TaskReplayService();

  const taskTimeoutScanJob = new TaskTimeoutScanJob(
    db,
    auditService,
    config.teamTaskTimeoutHours,
  );
  const desktopHeartbeatCleanupJob = new DesktopHeartbeatCleanupJob(db);
  if (config.nodeEnv !== "test") {
    globalEventBus.on("team_task.created", (event) => {
      logger.debug({ event: event.name, payload: event.payload }, "Domain event");
    });
    globalEventBus.on("team_task.status_changed", (event) => {
      logger.debug({ event: event.name, payload: event.payload }, "Domain event");
    });
    globalEventBus.on("hermes.run.succeeded", (event) => {
      logger.debug({ event: event.name, payload: event.payload }, "Domain event");
    });
    globalEventBus.on("hermes.run.failed", (event) => {
      logger.debug({ event: event.name, payload: event.payload }, "Domain event");
    });
    taskTimeoutScanJob.start();
    desktopHeartbeatCleanupJob.start();
  }

  api.use(
    "/documents",
    documentRoutes({ db, repo, service: docService, storage, config }),
  );
  api.use(
    "/email",
    emailRoutes({
      db,
      accountService: emailAccountService,
      messageService: emailMessageService,
      syncService: emailSyncService,
      attachmentRepo: emailAttachmentRepo,
      storage,
      auditService,
      config,
    }),
  );

  api.use(
    "/workspaces",
    workspaceRoutes(db, workspaceService, membershipService, roleService, permissionService),
  );

  api.use("/permissions", permissionsRoutes(permissionService));
  api.use("/users", userRoutes(userService));
  api.use("/audit", auditRoutes(auditService));

  api.use("/team/tasks", taskReplayRoutes(db, taskReplayService));
  api.use("/team/tasks", teamTaskRoutes(db, teamTaskService));

  api.use(
    "/hermes",
    hermesRoutes(db, {
      runService: hermesRunService,
      eventService: hermesEventService,
      toolCallService: hermesToolCallService,
      toolFacadeService,
      promptTemplateService,
    }),
  );

  const serviceCenterRouter = Router();
  serviceCenterRouter.use(serviceCenterProfileRoutes(db, profileService));
  serviceCenterRouter.use(serviceCenterSkillRoutes(db, skillTemplateService));
  serviceCenterRouter.use(serviceCenterPluginRoutes(db, pluginService));
  serviceCenterRouter.use(
    serviceCenterMcpRoutes(db, {
      serverService: mcpServerService,
      toolService: mcpToolService,
      healthService: mcpHealthService,
    }),
  );
  serviceCenterRouter.use(
    "/desktop",
    desktopSyncRoutes(db, {
      clientService: desktopClientService,
      bootstrapService,
    }),
  );
  api.use("/service-center", serviceCenterRouter);

  api.use("/connectors", connectorRoutes(db, connectorService));

  app.use("/api/v1", api);

  app.use(errorHandler);

  app.locals.eventBus = globalEventBus;
  app.locals.taskTimeoutScanJob = taskTimeoutScanJob;
  app.locals.desktopHeartbeatCleanupJob = desktopHeartbeatCleanupJob;

  return app;
}
