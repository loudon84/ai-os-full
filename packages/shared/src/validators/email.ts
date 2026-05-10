import { z } from "zod";

import {
  EMAIL_ACCOUNT_STATUSES,
  EMAIL_BATCH_ACTIONS,
  EMAIL_FOLDER_TYPES,
  EMAIL_PROVIDER_TYPES,
  EMAIL_RECEIVE_PROTOCOLS,
  EMAIL_SORT_FIELDS,
} from "../constants";

const nullableString = z.string().optional().nullable();

export const emailAddressSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    address: z.string().email().max(320),
  })
  .strict();

const emailAccountBaseSchema = z.object({
  email_address: z.string().email().max(320),
  display_name: z.string().max(128).optional().nullable(),
  provider_type: z.enum(EMAIL_PROVIDER_TYPES),
  receive_protocol: z.enum(EMAIL_RECEIVE_PROTOCOLS).default("imap"),
  imap_host: nullableString,
  imap_port: z.number().int().min(1).max(65535).optional().nullable(),
  imap_secure: z.boolean().default(true),
  pop3_host: nullableString,
  pop3_port: z.number().int().min(1).max(65535).optional().nullable(),
  pop3_secure: z.boolean().default(true),
  smtp_host: z.string().min(1).max(255),
  smtp_port: z.coerce.number().int().min(1).max(65535),
  smtp_secure: z.boolean().default(true),
  smtp_require_starttls: z.boolean().default(false),
  username: z.string().min(1).max(320),
  password: z.string().min(1).max(2048),
  sync_interval_seconds: z.coerce.number().int().min(60).max(86400).default(300),
}).strict();

export { emailAccountBaseSchema };

export const createEmailAccountSchema = emailAccountBaseSchema
  .superRefine((value, ctx) => {
    if (value.receive_protocol === "imap" && (!value.imap_host || !value.imap_port)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["imap_host"],
        message: "IMAP host and port are required when receive_protocol is imap",
      });
    }
    if (value.receive_protocol === "pop3" && (!value.pop3_host || !value.pop3_port)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pop3_host"],
        message: "POP3 host and port are required when receive_protocol is pop3",
      });
    }
  });
export type CreateEmailAccountInput = z.infer<typeof createEmailAccountSchema>;

export const updateEmailAccountSchema = emailAccountBaseSchema.partial().strict();
export type UpdateEmailAccountInput = z.infer<typeof updateEmailAccountSchema>;

export const testConnectionSchema = createEmailAccountSchema;
export type TestConnectionInput = z.infer<typeof testConnectionSchema>;

export const emailListQuerySchema = z.object({
  folder_path: z.string().min(1).max(512).optional(),
  folder_type: z.enum(EMAIL_FOLDER_TYPES).optional(),
  search: z.string().min(1).max(255).optional(),
  is_read: z.coerce.boolean().optional(),
  is_starred: z.coerce.boolean().optional(),
  has_attachments: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(200).default(50),
  sort_by: z.enum(EMAIL_SORT_FIELDS).default("date"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});
export type EmailListQueryInput = z.infer<typeof emailListQuerySchema>;

export const sendEmailSchema = z
  .object({
    to: z.array(emailAddressSchema).min(1),
    cc: z.array(emailAddressSchema).default([]),
    bcc: z.array(emailAddressSchema).default([]),
    subject: z.string().min(1).max(998),
    body_html: z.string().min(1),
    body_text: z.string().optional().nullable(),
    in_reply_to: z.string().max(998).optional().nullable(),
    references: z.array(z.string().max(998)).default([]),
    attachment_ids: z.array(z.string().uuid()).default([]),
  })
  .strict();
export type SendEmailInput = z.infer<typeof sendEmailSchema>;

export const updateEmailMessageSchema = z
  .object({
    is_read: z.boolean().optional(),
    is_starred: z.boolean().optional(),
  })
  .strict()
  .refine((value) => value.is_read !== undefined || value.is_starred !== undefined, {
    message: "At least one message flag must be provided",
  });
export type UpdateEmailMessageInput = z.infer<typeof updateEmailMessageSchema>;

export const batchEmailActionSchema = z
  .object({
    message_ids: z.array(z.string().uuid()).min(1).max(200),
    action: z.enum(EMAIL_BATCH_ACTIONS),
    target_folder: z.string().min(1).max(512).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.action === "move" && !value.target_folder) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["target_folder"],
        message: "target_folder is required for move action",
      });
    }
  });
export type BatchEmailActionInput = z.infer<typeof batchEmailActionSchema>;

export const emailMessageIdParamSchema = z.object({
  messageId: z.string().uuid(),
});

export const emailAttachmentIdParamSchema = z.object({
  attachmentId: z.string().uuid(),
});

export const emailSyncStatusSchema = z.object({
  status: z.enum(EMAIL_ACCOUNT_STATUSES),
});
