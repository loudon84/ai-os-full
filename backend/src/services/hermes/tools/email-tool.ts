import { and, asc, eq } from "drizzle-orm";

import type { EmailFolderType } from "@portal/shared";
import { EMAIL_FOLDER_TYPES } from "@portal/shared";

import { emailMessages } from "@portal/db";

import type { HermesToolHandler } from "./tool-context.js";

function parseFolderType(value: unknown): EmailFolderType | undefined {
  if (typeof value !== "string") return undefined;
  return EMAIL_FOLDER_TYPES.includes(value as EmailFolderType)
    ? (value as EmailFolderType)
    : undefined;
}

export function emailToolHandlers(): Record<string, HermesToolHandler> {
  return {
    search: async (deps, input) => {
      const result = await deps.emailMessageService.listMessages(deps.ctx, {
        page: typeof input.page === "number" ? input.page : 1,
        page_size: typeof input.page_size === "number" ? input.page_size : 20,
        sort_by: "date",
        sort_order: "desc",
        search: typeof input.search === "string" ? input.search : undefined,
        folder_path: typeof input.folder_path === "string" ? input.folder_path : undefined,
        folder_type: parseFolderType(input.folder_type),
        is_read: typeof input.is_read === "boolean" ? input.is_read : undefined,
        is_starred: typeof input.is_starred === "boolean" ? input.is_starred : undefined,
        has_attachments:
          typeof input.has_attachments === "boolean" ? input.has_attachments : undefined,
      });
      return {
        items: result.items.map((item) => ({
          message_id: item.id,
          thread_id: item.thread_id,
          subject: item.subject,
          from_address: item.from?.address ?? null,
          snippet: item.snippet,
          received_at: item.received_at,
        })),
        total: result.total,
      };
    },

    read_thread: async (deps, input) => {
      const threadId = String(input.thread_id ?? "");
      if (!threadId) return { error: "thread_id is required" };

      const rows = await deps.db
        .select()
        .from(emailMessages)
        .where(
          and(
            eq(emailMessages.workspaceId, deps.ctx.workspaceId),
            eq(emailMessages.threadId, threadId),
            eq(emailMessages.isDeleted, false),
          ),
        )
        .orderBy(asc(emailMessages.receivedAt))
        .limit(50);

      return {
        thread: {
          thread_id: threadId,
          messages: rows.map((row) => ({
            message_id: row.id,
            subject: row.subject,
            from_address: row.fromAddress,
            snippet: row.snippet,
            body_text: row.textBody?.slice(0, 4000) ?? null,
            received_at: row.receivedAt?.toISOString() ?? null,
          })),
        },
      };
    },

    create_draft: async (_deps, _input) => ({
      draft_id: null,
      message: "Email draft creation is handled via the email workspace UI",
    }),
  };
}
