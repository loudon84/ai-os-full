CREATE TABLE "hermes_gateway_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid,
	"name" varchar(128) NOT NULL,
	"gateway_type" varchar(32) NOT NULL,
	"base_url" text NOT NULL,
	"auth_mode" varchar(32) DEFAULT 'none' NOT NULL,
	"auth_token" text,
	"status" varchar(32) DEFAULT 'unknown' NOT NULL,
	"model_capabilities" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tool_capabilities" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_health_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hermes_run_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hermes_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" varchar(128),
	"run_type" varchar(64) NOT NULL,
	"gateway_instance_id" uuid,
	"prompt_template_id" uuid,
	"prompt_template_version_id" uuid,
	"status" varchar(32) DEFAULT 'queued' NOT NULL,
	"input" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"context_refs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"output_text" text,
	"error_code" varchar(64),
	"error_message" text,
	"started_at" timestamp,
	"finished_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hermes_tool_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"tool_name" varchar(128) NOT NULL,
	"tool_action" varchar(128) NOT NULL,
	"input" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output" jsonb,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"risk_level" varchar(32) DEFAULT 'low' NOT NULL,
	"approval_required" boolean DEFAULT false NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_template_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"body" text NOT NULL,
	"variables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"scene" varchar(128) NOT NULL,
	"description" text,
	"latest_version_id" uuid,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
