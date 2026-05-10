import type {
  CreateDocumentAiInteractionRequest,
  CreateDocumentAiInteractionResponse,
  DocumentAiInteraction,
  DocumentAiPatchWire,
  PatchDecisionRequest,
  PatchDecisionResponse,
  PatchValidateRequest,
  PatchValidateResponse,
} from "../types/documentAi.types";

let interactionCounter = 1;
let patchCounter = 1;

export async function mockCreateDocumentAiInteraction(
  _body: CreateDocumentAiInteractionRequest
): Promise<CreateDocumentAiInteractionResponse> {
  const id = `iai_mock_${interactionCounter++}`;
  return {
    interaction_id: id,
    task_id: `task_mock_${id}`,
    execution_id: `exec_mock_${id}`,
    status: "submitted",
    stream_url: `/api/v1/document-ai/interactions/${id}/events/stream`,
    proposed_patch_id: null,
  };
}

export async function mockGetDocumentAiInteraction(interactionId: string): Promise<DocumentAiInteraction> {
  return {
    interaction_id: interactionId,
    document_id: "doc_mock",
    workbook_id: "wb_mock",
    version_id: "1",
    session_id: "sess_mock",
    mode: "analyze_selection",
    prompt: "mock",
    status: "submitted",
    sheet_context: null,
    task_id: null,
    execution_id: null,
  };
}

export async function mockValidatePatch(req: PatchValidateRequest): Promise<PatchValidateResponse> {
  const op = req.patch.op;
  const rng = req.patch.range;
  const cells = rng.rowCount * rng.columnCount;
  const risk = cells <= 100 ? "low" : cells <= 3000 ? "medium" : "high";

  const validOp = op === "set_cell_values" || op === "set_cell_formulas";
  return {
    valid: validOp && cells > 0 && cells <= 3000,
    patch_id: req.patch.patchId,
    risk_level: risk,
    affected_cells: cells,
    warnings: [],
  };
}

export async function mockSubmitPatchDecision(
  patchId: string,
  _body: PatchDecisionRequest
): Promise<PatchDecisionResponse> {
  return {
    patch_id: patchId,
    apply_status: "logged",
    audit_event_id: `audit_${patchCounter++}`,
  };
}

export async function mockGetDocumentAiPatch(patchId: string): Promise<DocumentAiPatchWire> {
  return {
    patch_id: patchId,
    interaction_id: "iai_mock",
    document_id: "doc_mock",
    workbook_id: "wb_mock",
    version_id: "1",
    patch_type: "set_cell_values",
    patch_json: {},
    risk_level: "low",
    validation_status: "valid",
    apply_status: "pending",
  };
}
