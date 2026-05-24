import { PermissionService } from "../../documents/permission.js";
import type { HermesToolHandler } from "./tool-context.js";

export function documentToolHandlers(): Record<string, HermesToolHandler> {
  return {
    search: async (deps, input) => {
      const keyword = typeof input.keyword === "string" ? input.keyword : undefined;
      const page = typeof input.page === "number" ? input.page : 1;
      const pageSize = typeof input.page_size === "number" ? input.page_size : 20;
      const { items, total } = await deps.documentRepo.listDocuments(deps.db, {
        workspaceId: deps.ctx.workspaceId,
        keyword,
        status: null,
        page,
        pageSize,
      });
      return {
        items: items.map((doc) => ({
          document_id: doc.id,
          title: doc.title,
          document_type: doc.documentType,
          status: doc.status,
          updated_at: doc.updatedAt.toISOString(),
        })),
        total,
      };
    },

    read: async (deps, input) => {
      const documentId = String(input.document_id ?? "");
      if (!documentId) return { error: "document_id is required" };

      const doc = await deps.documentService.getDocumentOr404(deps.db, documentId);
      if (doc.workspaceId !== deps.ctx.workspaceId) {
        return { error: "Document not found" };
      }

      const role = await deps.documentService.getCurrentUserRole(
        deps.db,
        deps.ctx,
        documentId,
      );
      if (!PermissionService.canView(role)) {
        return { error: "Permission denied" };
      }

      return {
        document: {
          document_id: doc.id,
          title: doc.title,
          document_type: doc.documentType,
          engine: doc.engine,
          status: doc.status,
          current_version_no: doc.currentVersionNo,
          updated_at: doc.updatedAt.toISOString(),
        },
      };
    },

    create_draft: async (deps, input) => {
      const title = typeof input.title === "string" && input.title.length > 0
        ? input.title
        : "Untitled";
      const created = await deps.documentService.createDocument(deps.ctx, title);
      return { draft_id: created.documentId, version_no: created.versionNo };
    },

    update_draft: async (deps, input) => {
      const documentId = String(input.document_id ?? "");
      if (!documentId) return { error: "document_id is required" };

      const doc = await deps.documentService.getDocumentOr404(deps.db, documentId);
      if (doc.workspaceId !== deps.ctx.workspaceId) {
        return { error: "Document not found" };
      }

      const role = await deps.documentService.getCurrentUserRole(
        deps.db,
        deps.ctx,
        documentId,
      );
      if (!PermissionService.canEdit(role)) {
        return { error: "Permission denied" };
      }

      return {
        updated: true,
        document_id: doc.id,
        title: doc.title,
        status: doc.status,
      };
    },
  };
}
