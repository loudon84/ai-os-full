export interface AiOsFormSubmitRequest {
  formId: string;
  specVersion: string;
  formData: Record<string, unknown>;
  submitMode: "portal_api" | "facade_task" | "workflow";
  taskType?: string;
  workflowId?: string;
  sourceTaskId?: string;
  traceId?: string;
}

export interface AiOsFormSubmitResponse {
  ok: boolean;
  submissionId?: string;
  taskId?: string;
  workflowRunId?: string;
  message?: string;
  errors?: Array<{
    path: string;
    message: string;
    code?: string;
  }>;
}

