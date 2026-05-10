CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid,
	"actor_user_id" uuid,
	"action" varchar(128) NOT NULL,
	"target_type" varchar(64) NOT NULL,
	"target_id" uuid,
	"result" varchar(32) DEFAULT 'success' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chk_audit_events_result" CHECK ("audit_events"."result" IN ('success', 'failure'))
);
--> statement-breakpoint
CREATE TABLE "email_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"email_address" varchar(320) NOT NULL,
	"display_name" varchar(128),
	"provider_type" varchar(32) DEFAULT 'custom' NOT NULL,
	"receive_protocol" varchar(8) DEFAULT 'imap' NOT NULL,
	"imap_host" varchar(255),
	"imap_port" integer,
	"imap_secure" boolean DEFAULT true NOT NULL,
	"pop3_host" varchar(255),
	"pop3_port" integer,
	"pop3_secure" boolean DEFAULT true NOT NULL,
	"smtp_host" varchar(255) NOT NULL,
	"smtp_port" integer NOT NULL,
	"smtp_secure" boolean DEFAULT true NOT NULL,
	"smtp_require_starttls" boolean DEFAULT false NOT NULL,
	"username" varchar(320) NOT NULL,
	"encrypted_password" text NOT NULL,
	"password_iv" varchar(32) NOT NULL,
	"password_auth_tag" varchar(32) NOT NULL,
	"sync_enabled" boolean DEFAULT true NOT NULL,
	"sync_interval_seconds" integer DEFAULT 300 NOT NULL,
	"last_sync_at" timestamp,
	"last_sync_error" text,
	"consecutive_sync_failures" integer DEFAULT 0 NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "uq_email_accounts_user" UNIQUE("user_id"),
	CONSTRAINT "chk_email_accounts_status" CHECK ("email_accounts"."status" IN ('active', 'error', 'syncing', 'disconnected', 'deleted')),
	CONSTRAINT "chk_email_accounts_protocol" CHECK ("email_accounts"."receive_protocol" IN ('imap', 'pop3')),
	CONSTRAINT "chk_email_accounts_provider" CHECK ("email_accounts"."provider_type" IN ('gmail', 'netease_163', 'aliyun_enterprise', 'tencent_exmail', 'custom'))
);
--> statement-breakpoint
CREATE TABLE "email_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"email_message_id" uuid NOT NULL,
	"filename" text,
	"content_type" varchar(255),
	"size_bytes" bigint,
	"storage_key" text NOT NULL,
	"sha256" varchar(64),
	"content_id" varchar(255),
	"is_inline" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"email_account_id" uuid NOT NULL,
	"direction" varchar(16) NOT NULL,
	"provider_uid" varchar(255),
	"message_id" varchar(998),
	"thread_id" varchar(998),
	"from_address" varchar(320),
	"from_name" varchar(255),
	"to_addresses" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cc_addresses" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bcc_addresses" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reply_to_addresses" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subject" text,
	"snippet" varchar(500),
	"text_body" text,
	"html_body" text,
	"date" timestamp,
	"received_at" timestamp,
	"sent_at" timestamp,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_starred" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"folder_path" varchar(512) DEFAULT 'INBOX' NOT NULL,
	"folder_type" varchar(32) DEFAULT 'inbox' NOT NULL,
	"has_attachments" boolean DEFAULT false NOT NULL,
	"in_reply_to" varchar(998),
	"references_list" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"related_task_id" uuid,
	"raw_storage_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_email_messages_account_uid" UNIQUE("email_account_id","provider_uid"),
	CONSTRAINT "chk_email_messages_direction" CHECK ("email_messages"."direction" IN ('inbound', 'outbound')),
	CONSTRAINT "chk_email_messages_folder_type" CHECK ("email_messages"."folder_type" IN ('inbox', 'sent', 'drafts', 'trash', 'spam', 'starred', 'archive', 'custom'))
);
--> statement-breakpoint
CREATE TABLE "email_sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_account_id" uuid NOT NULL,
	"sync_type" varchar(16) NOT NULL,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"status" varchar(16) DEFAULT 'running' NOT NULL,
	"messages_found" integer DEFAULT 0 NOT NULL,
	"messages_synced" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	CONSTRAINT "chk_email_sync_logs_type" CHECK ("email_sync_logs"."sync_type" IN ('manual', 'scheduled', 'initial')),
	CONSTRAINT "chk_email_sync_logs_status" CHECK ("email_sync_logs"."status" IN ('running', 'success', 'failure'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"display_name" varchar(128),
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "chk_users_status" CHECK ("users"."status" IN ('active', 'disabled'))
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"member_limit" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "chk_workspaces_status" CHECK ("workspaces"."status" IN ('active', 'deleted'))
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(32) DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_memberships_workspace_user" UNIQUE("workspace_id","user_id"),
	CONSTRAINT "chk_memberships_role" CHECK ("memberships"."role" IN ('super_admin', 'admin', 'owner', 'user'))
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid,
	"name" varchar(128) NOT NULL,
	"code" varchar(64) NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_roles_workspace_code" UNIQUE("workspace_id","code")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(128) NOT NULL,
	"description" varchar(512),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	CONSTRAINT "uq_role_permissions_role_permission" UNIQUE("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_accounts" ADD CONSTRAINT "email_accounts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_accounts" ADD CONSTRAINT "email_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_attachments" ADD CONSTRAINT "email_attachments_email_message_id_email_messages_id_fk" FOREIGN KEY ("email_message_id") REFERENCES "public"."email_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_email_account_id_email_accounts_id_fk" FOREIGN KEY ("email_account_id") REFERENCES "public"."email_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_sync_logs" ADD CONSTRAINT "email_sync_logs_email_account_id_email_accounts_id_fk" FOREIGN KEY ("email_account_id") REFERENCES "public"."email_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;