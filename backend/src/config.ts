import { z } from "zod";

const configSchema = z.object({
  port: z.coerce.number().default(8000),
  dbUrl: z.string().min(1, "DATABASE_URL is required"),
  defaultTenantId: z.string().default(""),
  defaultWorkspaceId: z.string().default(""),
  defaultUserId: z.string().default(""),
  nodeEnv: z.enum(["development", "production", "test"]).default("development"),
  s3Endpoint: z.string().optional(),
  s3Region: z.string().default("us-east-1"),
  s3Bucket: z.string().default("portal-documents"),
  s3AccessKeyId: z.string().optional(),
  s3SecretAccessKey: z.string().optional(),
  s3ForcePathStyle: z.coerce.boolean().default(true),
  snapshotMaxBytes: z.coerce.number().default(20 * 1024 * 1024),
  emailCredentialEncryptionKey: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, "EMAIL_CREDENTIAL_ENCRYPTION_KEY must be 64 hex chars")
    .optional(),
  emailDefaultSyncIntervalSec: z.coerce.number().default(300),
  emailSyncEnabled: z.coerce.boolean().default(true),
  emailMaxAttachmentBytes: z.coerce.number().default(25 * 1024 * 1024),
  emailAttachmentBucket: z.string().default("portal-email-attachments"),

  jwtSecret: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  jwtRefreshSecret: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  jwtAccessExpSec: z.coerce.number().default(900),
  jwtRefreshExpSec: z.coerce.number().default(604800),
  refreshTokenMax: z.coerce.number().default(5),
  loginMaxAttempts: z.coerce.number().default(5),
  loginLockDurationSec: z.coerce.number().default(900),
  workspaceMemberLimit: z.coerce.number().default(100),
  superAdminEmail: z.string().optional(),
  superAdminPassword: z.string().optional(),
}).superRefine((value, ctx) => {
  if (value.nodeEnv === "production" && !value.emailCredentialEncryptionKey) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["emailCredentialEncryptionKey"],
      message: "EMAIL_CREDENTIAL_ENCRYPTION_KEY is required in production",
    });
  }
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(): AppConfig {
  return configSchema.parse({
    port: process.env.PORT,
    dbUrl: process.env.DATABASE_URL,
    defaultTenantId: process.env.DEFAULT_TENANT_ID,
    defaultWorkspaceId: process.env.DEFAULT_WORKSPACE_ID,
    defaultUserId: process.env.DEFAULT_USER_ID,
    nodeEnv: process.env.NODE_ENV,
    s3Endpoint: process.env.S3_ENDPOINT_URL,
    s3Region: process.env.S3_REGION,
    s3Bucket: process.env.DOCUMENT_SNAPSHOT_BUCKET,
    s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? process.env.S3_ACCESS_KEY,
    s3SecretAccessKey:
      process.env.S3_SECRET_ACCESS_KEY ?? process.env.S3_SECRET_KEY,
    s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE,
    snapshotMaxBytes: process.env.DOCUMENT_SNAPSHOT_MAX_BYTES,
    emailCredentialEncryptionKey: process.env.EMAIL_CREDENTIAL_ENCRYPTION_KEY,
    emailDefaultSyncIntervalSec: process.env.EMAIL_DEFAULT_SYNC_INTERVAL_SEC,
    emailSyncEnabled: process.env.EMAIL_SYNC_ENABLED,
    emailMaxAttachmentBytes: process.env.EMAIL_MAX_ATTACHMENT_BYTES,
    emailAttachmentBucket: process.env.EMAIL_ATTACHMENT_BUCKET,
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtAccessExpSec: process.env.JWT_ACCESS_EXP_SEC,
    jwtRefreshExpSec: process.env.JWT_REFRESH_EXP_SEC,
    refreshTokenMax: process.env.REFRESH_TOKEN_MAX,
    loginMaxAttempts: process.env.LOGIN_MAX_ATTEMPTS,
    loginLockDurationSec: process.env.LOGIN_LOCK_DURATION_SEC,
    workspaceMemberLimit: process.env.WORKSPACE_MEMBER_LIMIT,
    superAdminEmail: process.env.SUPER_ADMIN_EMAIL,
    superAdminPassword: process.env.SUPER_ADMIN_PASSWORD,
  });
}
