import { createDb } from "@portal/db";
import cors from "cors";
import express, { type Express, Router } from "express";

import type { AppConfig } from "./config.js";
import { JwtProvider } from "./auth-provider/jwt-provider.js";
import { authV2Middleware } from "./middleware/auth-v2.js";
import { errorHandler } from "./middleware/error-handler.js";
import { httpLogger } from "./middleware/logger.js";
import { authRoutes } from "./routes/auth.js";
import { auditRoutes } from "./routes/audit.js";
import { documentRoutes } from "./routes/documents.js";
import { emailRoutes } from "./routes/email.js";
import { healthRoutes } from "./routes/health.js";
import { permissionsRoutes } from "./routes/permissions.js";
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
import { SnapshotStorage } from "./storage/snapshot-storage.js";

export function createApp(config: AppConfig): Express {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "32mb" }));
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

  app.use("/api/v1", api);

  app.use(errorHandler);
  return app;
}
