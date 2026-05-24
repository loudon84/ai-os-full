import type { ContextPackage, HermesContextRef } from "@portal/shared";

import type { Db } from "@portal/db";
import { emailMessages, memberships, teamTasks } from "@portal/db";
import { and, asc, eq } from "drizzle-orm";

import { forbidden } from "../../errors.js";
import type { RequestContext } from "../../middleware/auth.js";
import type { DocumentRepository } from "../documents/repository.js";
import { PermissionService } from "../documents/permission.js";
import type { EmailMessageRepository } from "../email/repository/email-message.repository.js";

const APPROX_CHARS_PER_TOKEN = 4;

function trimText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}…`;
}

export interface ContextBuilderDeps {
  documentRepo: DocumentRepository;
  documentPermission: PermissionService;
  emailMessageRepo?: EmailMessageRepository;
}

export class ContextBuilder {
  constructor(private readonly deps?: ContextBuilderDeps) {}

  async buildContext(
    db: Db,
    ctx: RequestContext,
    input: {
      workspaceId: string;
      userId: string;
      runType: string;
      taskId?: string;
      contextRefs: HermesContextRef[];
      tokenBudget: number;
    },
  ): Promise<ContextPackage> {
    const maxChars = input.tokenBudget * APPROX_CHARS_PER_TOKEN;
    let usedChars = 0;

    const [membership] = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.workspaceId, input.workspaceId),
          eq(memberships.userId, input.userId),
        ),
      )
      .limit(1);
    if (!membership) {
      forbidden("User is not a member of this workspace");
    }

    const pkg: ContextPackage = {
      workspace: { workspace_id: input.workspaceId },
      user: { user_id: input.userId, role: membership.role },
      task: null,
      documents: [],
      emails: [],
      profiles: [],
      skills: [],
      plugins: [],
      audit_summary: [],
      source_refs: [...input.contextRefs],
    };

  const appendEntry = (
      bucket: Array<Record<string, unknown>>,
      entry: Record<string, unknown>,
    ) => {
      const serialized = JSON.stringify(entry);
      if (usedChars + serialized.length > maxChars) return false;
      bucket.push(entry);
      usedChars += serialized.length;
      return true;
    };

    if (input.taskId) {
      const [task] = await db
        .select()
        .from(teamTasks)
        .where(eq(teamTasks.id, input.taskId))
        .limit(1);
      if (task && task.workspaceId === input.workspaceId) {
        const snippet = trimText(
          JSON.stringify({
            task_id: task.id,
            title: task.title,
            status: task.status,
            task_type: task.taskType,
          }),
          Math.min(2000, maxChars - usedChars),
        );
        usedChars += snippet.length;
        pkg.task = JSON.parse(snippet) as Record<string, unknown>;
      }
    }

    for (const ref of input.contextRefs) {
      if (usedChars >= maxChars) break;

      if (ref.type === "document" && this.deps) {
        const doc = await this.deps.documentRepo.getDocument(db, ref.id);
        if (!doc || doc.workspaceId !== input.workspaceId) continue;
        const role = await this.deps.documentPermission.getUserRole(db, {
          documentId: ref.id,
          userId: ctx.userId,
          roles: ctx.roles,
          departments: ctx.departments,
        });
        if (!PermissionService.canView(role)) continue;
        appendEntry(pkg.documents, {
          ref_type: ref.type,
          ref_id: ref.id,
          title: doc.title,
          document_type: doc.documentType,
          status: doc.status,
          summary: trimText(doc.title, 500),
        });
        continue;
      }

      if (ref.type === "email_thread") {
        const rows = await db
          .select()
          .from(emailMessages)
          .where(
            and(
              eq(emailMessages.workspaceId, input.workspaceId),
              eq(emailMessages.threadId, ref.id),
              eq(emailMessages.isDeleted, false),
            ),
          )
          .orderBy(asc(emailMessages.receivedAt))
          .limit(5);
        if (rows.length === 0) continue;
        const bodyPreview = rows
          .map((row) => row.textBody ?? row.snippet ?? "")
          .join("\n");
        appendEntry(pkg.emails, {
          ref_type: ref.type,
          ref_id: ref.id,
          subject: rows.at(-1)?.subject ?? null,
          message_count: rows.length,
          summary: trimText(bodyPreview, Math.min(2000, maxChars - usedChars)),
        });
        continue;
      }

      if (ref.type === "team_task") {
        const [task] = await db
          .select()
          .from(teamTasks)
          .where(eq(teamTasks.id, ref.id))
          .limit(1);
        if (task?.workspaceId === input.workspaceId) {
          pkg.task = {
            task_id: task.id,
            title: task.title,
            status: task.status,
          };
        }
        continue;
      }

      const entry = {
        ref_type: ref.type,
        ref_id: ref.id,
        summary: trimText(`${ref.type}:${ref.id}`, 500),
      };
      if (ref.type === "skill_template") appendEntry(pkg.skills, entry);
      else if (ref.type === "profile") appendEntry(pkg.profiles, entry);
    }

    return pkg;
  }
}
