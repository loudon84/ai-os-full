export type AiOsFormVersion = "1.0";

export type AiOsFormLayoutType =
  | "single-column"
  | "two-column"
  | "sectioned"
  | "wizard";

export type AiOsSubmitMode = "portal_api" | "facade_task" | "workflow";

export interface AiOsFormSpec {
  kind: "form";
  version: AiOsFormVersion;

  formId: string;
  title: string;
  description?: string;

  schema: Record<string, unknown>;
  uiSchema?: Record<string, unknown>;

  layout?: AiOsFormLayout;

  actions: AiOsFormAction[];

  submit: AiOsFormSubmit;

  permissions?: AiOsFormPermissions;

  runtime?: AiOsFormRuntimePolicy;

  metadata?: {
    generatedBy?: "developer_agent" | "human" | "system";
    sourceTaskId?: string;
    traceId?: string;
    tags?: string[];
  };
}

export interface AiOsFormLayout {
  type: AiOsFormLayoutType;
  sections?: AiOsFormSection[];
}

export interface AiOsFormSection {
  id: string;
  title: string;
  description?: string;
  fields: string[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export interface AiOsFormAction {
  id: string;
  label: string;
  type: "submit" | "reset" | "cancel" | "draft";
  variant?: "default" | "secondary" | "destructive" | "outline";
  confirm?: {
    title: string;
    message: string;
  };
}

export interface AiOsFormSubmit {
  mode: AiOsSubmitMode;

  endpoint?: string;
  method?: "POST" | "PUT" | "PATCH";

  taskType?: string;
  workflowId?: string;

  successMessage?: string;
  failureMessage?: string;
}

export interface AiOsFormPermissions {
  readonlyFields?: string[];
  hiddenFields?: string[];
}

export interface AiOsFormRuntimePolicy {
  allowDebug?: boolean;
  allowDraft?: boolean;
  allowExternalEndpoint?: boolean;
  maxFields?: number;
  maxDepth?: number;
}

