import type { AiOsFormSpec } from "../types/form-spec";
import type { AiOsFormSubmitRequest, AiOsFormSubmitResponse } from "../types/form-submit";

const ENDPOINT_ALLOWLIST = new Set([
  "/api/forms/submit",
  "/api/facade/tasks",
  "/api/workflows/run",
]);

function assertAllowedEndpoint(endpoint: string) {
  if (!ENDPOINT_ALLOWLIST.has(endpoint)) {
    throw new Error(`不允许的提交 endpoint: ${endpoint}`);
  }
}

function buildSubmitRequest(spec: AiOsFormSpec, formData: Record<string, unknown>): AiOsFormSubmitRequest {
  const submitMode = spec.submit.mode;

  return {
    formId: spec.formId,
    specVersion: spec.version,
    formData,
    submitMode,
    taskType: spec.submit.taskType,
    workflowId: spec.submit.workflowId,
    sourceTaskId: spec.metadata?.sourceTaskId,
    traceId: spec.metadata?.traceId,
  };
}

export async function submitForm(spec: AiOsFormSpec, formData: Record<string, unknown>): Promise<AiOsFormSubmitResponse> {
  const mode = spec.submit.mode;

  if (mode === "portal_api") {
    const endpoint = spec.submit.endpoint ?? "/api/forms/submit";
    assertAllowedEndpoint(endpoint);

    const resp = await fetch(endpoint, {
      method: spec.submit.method ?? "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildSubmitRequest(spec, formData)),
    });

    return (await resp.json()) as AiOsFormSubmitResponse;
  }

  if (mode === "facade_task") {
    const endpoint = "/api/facade/tasks";
    assertAllowedEndpoint(endpoint);

    const payload = {
      taskType: spec.submit.taskType ?? spec.formId,
      input: {
        formId: spec.formId,
        formData,
      },
      source: "dynamic_form",
    };

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    // facade 的返回在当前阶段可能未实现：统一映射为 AiOsFormSubmitResponse
    const json = await resp.json().catch(() => null);
    if (json && typeof json === "object") {
      const taskId = (json as any).taskId ?? (json as any).id;
      return { ok: resp.ok, taskId, message: resp.ok ? spec.submit.successMessage : spec.submit.failureMessage };
    }

    return { ok: resp.ok, message: resp.ok ? spec.submit.successMessage : spec.submit.failureMessage };
  }

  if (mode === "workflow") {
    const endpoint = "/api/workflows/run";
    assertAllowedEndpoint(endpoint);

    const payload = {
      workflowId: spec.submit.workflowId,
      input: {
        formId: spec.formId,
        formData,
      },
      source: "dynamic_form",
    };

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await resp.json().catch(() => null);
    const workflowRunId = json && typeof json === "object" ? (json as any).workflowRunId ?? (json as any).id : undefined;
    return { ok: resp.ok, workflowRunId, message: resp.ok ? spec.submit.successMessage : spec.submit.failureMessage };
  }

  return { ok: false, message: "未知 submit 模式" };
}

