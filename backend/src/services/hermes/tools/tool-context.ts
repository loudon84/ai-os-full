import type { Db } from "@portal/db";

import type { RequestContext } from "../../../middleware/auth.js";
import type { AuditService } from "../../audit/audit-service.js";
import type { DocumentRepository } from "../../documents/repository.js";
import type { DocumentService } from "../../documents/service.js";
import type { PermissionService } from "../../documents/permission.js";
import type { EmailMessageRepository } from "../../email/repository/email-message.repository.js";
import type { EmailMessageService } from "../../email/email-message.service.js";
import type { TeamTaskService } from "../../team-tasks/team-task.service.js";

export interface HermesToolDeps {
  db: Db;
  ctx: RequestContext;
  documentService: DocumentService;
  documentRepo: DocumentRepository;
  documentPermission: PermissionService;
  emailMessageService: EmailMessageService;
  emailMessageRepo: EmailMessageRepository;
  teamTaskService: TeamTaskService;
  auditService: AuditService;
}

export type HermesToolHandler = (
  deps: HermesToolDeps,
  input: Record<string, unknown>,
) => Promise<Record<string, unknown>>;

export type HermesToolRegistry = Record<string, Record<string, HermesToolHandler>>;
