CREATE TABLE "document_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"actor_id" uuid NOT NULL,
	"version_no" integer,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"subject_type" varchar(32) NOT NULL,
	"subject_id" uuid NOT NULL,
	"role" varchar(32) NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_document_permissions_subject_role" UNIQUE("document_id","subject_type","subject_id","role"),
	CONSTRAINT "chk_document_permission_subject" CHECK ("document_permissions"."subject_type" IN ('user', 'role', 'department')),
	CONSTRAINT "chk_document_permission_role" CHECK ("document_permissions"."role" IN ('view', 'edit', 'owner'))
);
--> statement-breakpoint
CREATE TABLE "document_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"version_no" integer NOT NULL,
	"snapshot_bucket" varchar(128) NOT NULL,
	"snapshot_key" text NOT NULL,
	"snapshot_size_bytes" bigint NOT NULL,
	"snapshot_checksum_sha256" varchar(64) NOT NULL,
	"engine" varchar(32) NOT NULL,
	"engine_version" varchar(64) NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"save_mode" varchar(32) DEFAULT 'manual' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_from" varchar(32),
	"related_interaction_id" varchar(64),
	"related_patch_id" varchar(64),
	CONSTRAINT "uq_document_versions_document_version" UNIQUE("document_id","version_no"),
	CONSTRAINT "chk_document_versions_engine" CHECK ("document_versions"."engine" IN ('univer')),
	CONSTRAINT "chk_document_versions_save_mode" CHECK ("document_versions"."save_mode" IN ('manual', 'autosave', 'system')),
	CONSTRAINT "chk_document_versions_created_from" CHECK ("document_versions"."created_from" IS NULL OR "document_versions"."created_from" IN ('manual_save', 'ai_patch_apply'))
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"document_type" varchar(32) NOT NULL,
	"engine" varchar(32) NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"provider" varchar(32) DEFAULT 'local' NOT NULL,
	"external_id" varchar(255),
	"external_url" text,
	"current_version_no" integer DEFAULT 1 NOT NULL,
	"current_version_id" uuid,
	"owner_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp,
	"deleted_at" timestamp,
	CONSTRAINT "chk_documents_type" CHECK ("documents"."document_type" IN ('spreadsheet')),
	CONSTRAINT "chk_documents_engine" CHECK ("documents"."engine" IN ('univer')),
	CONSTRAINT "chk_documents_status" CHECK ("documents"."status" IN ('draft', 'active', 'archived', 'deleted')),
	CONSTRAINT "chk_documents_provider" CHECK ("documents"."provider" IN ('local', 'wecom', 'onlyoffice'))
);
--> statement-breakpoint
ALTER TABLE "document_events" ADD CONSTRAINT "document_events_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_permissions" ADD CONSTRAINT "document_permissions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_document_events_document_created" ON "document_events" USING btree ("document_id","created_at");