CREATE TABLE "agent_profile_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"config_key" varchar(128) NOT NULL,
	"config_value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_profile_manifests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"manifest" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_profile_mcp_servers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"server_id" uuid NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_profile_policy_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"rule_key" varchar(128) NOT NULL,
	"rule_value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_profile_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"version_id" uuid,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_profile_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"default_model_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"default_tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"default_policy" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"role_key" varchar(64) NOT NULL,
	"role_name" varchar(128) NOT NULL,
	"display_name" varchar(128) NOT NULL,
	"description" text,
	"template_id" uuid,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connector_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"connector_key" varchar(64) NOT NULL,
	"connector_type" varchar(32) NOT NULL,
	"name" varchar(128) NOT NULL,
	"webhook_secret_ref" varchar(256),
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connector_task_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connector_id" uuid NOT NULL,
	"webhook_event_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connector_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connector_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"status" varchar(32) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "desktop_bootstrap_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "desktop_client_heartbeats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"status_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "desktop_client_revocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"revoked_by_user_id" uuid NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "desktop_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"client_name" varchar(128),
	"desktop_version" varchar(64),
	"copilot_serve_version" varchar(64),
	"platform" varchar(32),
	"arch" varchar(32),
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"last_seen_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "desktop_sync_cursors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"cursor" varchar(256) NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_task_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"approver_user_id" uuid,
	"status" varchar(32) NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "team_task_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"artifact_type" varchar(32) NOT NULL,
	"name" varchar(512) NOT NULL,
	"storage_key" varchar(1024),
	"url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_task_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"assignee_user_id" uuid NOT NULL,
	"target_profile_id" varchar(128),
	"target_agent_id" varchar(128),
	"desktop_client_id" uuid,
	"assigned_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_task_context_refs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"ref_type" varchar(64) NOT NULL,
	"ref_id" varchar(256) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_task_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"status" varchar(32),
	"message" text,
	"actor_user_id" uuid,
	"actor_agent_id" varchar(128),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_task_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"status" varchar(32) NOT NULL,
	"summary" text,
	"output_text" text,
	"git_commit" varchar(128),
	"pr_url" text,
	"logs_summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid,
	"title" varchar(512) NOT NULL,
	"description" text,
	"task_type" varchar(64) NOT NULL,
	"risk_level" varchar(32) DEFAULT 'low' NOT NULL,
	"status" varchar(32) DEFAULT 'created' NOT NULL,
	"assignee_user_id" uuid,
	"target_profile_id" varchar(128),
	"target_agent_id" varchar(128),
	"source_agent_id" varchar(128),
	"created_by_user_id" uuid NOT NULL,
	"workspace_path" varchar(1024),
	"requires_approval" boolean DEFAULT false NOT NULL,
	"input" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"acceptance_criteria" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chk_team_tasks_status" CHECK ("team_tasks"."status" IN ('draft','created','assigned','acknowledged','pending_approval','approved','running','succeeded','failed','cancelled','rejected','expired','retrying'))
);
--> statement-breakpoint
CREATE TABLE "skill_install_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"installed_by_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_profile_bindings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_publish_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"published_by_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_template_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"path" varchar(512) NOT NULL,
	"checksum" varchar(128) NOT NULL,
	"content_type" varchar(128) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_template_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"version_no" varchar(32) NOT NULL,
	"entry_file" varchar(512) NOT NULL,
	"variables_schema" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"required_permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"compatible_profiles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"category" varchar(64),
	"skill_type" varchar(64) NOT NULL,
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_install_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plugin_id" uuid NOT NULL,
	"version_id" uuid,
	"profile_id" uuid,
	"workspace_id" uuid NOT NULL,
	"installed_by_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_manifests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"plugin_type" varchar(64) NOT NULL,
	"runtime" varchar(32) NOT NULL,
	"entrypoint" varchar(512) NOT NULL,
	"required_permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"config_schema" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"compatible_profiles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_permission_declarations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plugin_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"permission_code" varchar(128) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plugin_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"version" varchar(64) NOT NULL,
	"checksum" varchar(128) NOT NULL,
	"manifest" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_profile_bindings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_server_health_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"status" varchar(32) NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_servers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"server_type" varchar(64) NOT NULL,
	"base_url" text,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_tool_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"permission_code" varchar(128) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"input_schema" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output_schema" jsonb,
	"required_permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"risk_level" varchar(32) DEFAULT 'low' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_rule_bindings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"target_type" varchar(64) NOT NULL,
	"target_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"rule_key" varchar(128) NOT NULL,
	"rule_type" varchar(64) NOT NULL,
	"rule_value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
