import { z } from "zod";

import {
  DOCUMENT_ENGINES,
  DOCUMENT_PERMISSION_ROLES,
  DOCUMENT_PERMISSION_SUBJECTS,
  DOCUMENT_STATUSES,
  DOCUMENT_TYPES,
  SNAPSHOT_SAVE_MODES,
  VERSION_CREATED_FROM,
} from "../constants";

const uuidSchema = z.string().uuid();

export const documentCreateSchema = z.object({
  title: z.string().min(1).max(255),
  document_type: z.enum(DOCUMENT_TYPES).default("spreadsheet"),
  engine: z.enum(DOCUMENT_ENGINES).default("univer"),
});
export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;

export const documentUpdateSchema = z
  .object({
    title: z.string().min(1).max(255).optional().nullable(),
    status: z.enum(DOCUMENT_STATUSES).optional().nullable(),
  })
  .strict();
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;

export const snapshotSaveSchema = z
  .object({
    base_version_no: z.coerce.number().int().min(1),
    save_mode: z.enum(SNAPSHOT_SAVE_MODES).default("manual"),
    engine_version: z.string().min(1).max(64),
    schema_version: z.coerce.number().int().default(1),
    snapshot: z.record(z.string(), z.unknown()),
    created_from: z.enum(VERSION_CREATED_FROM).optional().nullable(),
    related_interaction_id: z.string().max(64).optional().nullable(),
    related_patch_id: z.string().max(64).optional().nullable(),
  })
  .strict();
export type SnapshotSaveInput = z.infer<typeof snapshotSaveSchema>;

export const documentPermissionItemSchema = z
  .object({
    subject_type: z.enum(DOCUMENT_PERMISSION_SUBJECTS),
    subject_id: uuidSchema,
    role: z.enum(DOCUMENT_PERMISSION_ROLES),
  })
  .strict();
export type DocumentPermissionItemInput = z.infer<
  typeof documentPermissionItemSchema
>;

export const documentPermissionsReplaceSchema = z
  .object({
    items: z.array(documentPermissionItemSchema),
  })
  .strict();
export type DocumentPermissionsReplaceInput = z.infer<
  typeof documentPermissionsReplaceSchema
>;

export const listQuerySchema = z.object({
  keyword: z.string().min(1).optional(),
  status: z.enum(DOCUMENT_STATUSES).optional().default("active"),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(200).default(20),
});
export type ListQueryInput = z.infer<typeof listQuerySchema>;

export const versionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(200).default(20),
});
export type VersionListQueryInput = z.infer<typeof versionListQuerySchema>;

export const eventListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(200).default(50),
});
export type EventListQueryInput = z.infer<typeof eventListQuerySchema>;

export const documentIdParamSchema = z.object({
  documentId: uuidSchema,
});

export const versionParamSchema = z.object({
  documentId: uuidSchema,
  versionNo: z.coerce.number().int().min(1),
});
