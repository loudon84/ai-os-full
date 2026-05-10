import { describe, expect, it } from "vitest";

import { withAiSaveLineage } from "../lib/snapshotSaveRequest";

describe("withAiSaveLineage", () => {
  const base = {
    base_version_no: 3,
    save_mode: "manual" as const,
    engine_version: "0.x",
    schema_version: 1,
    snapshot: { foo: 1 },
  };

  it("omits lineage keys when state is null", () => {
    const out = withAiSaveLineage(base, null);
    expect(out).toEqual(base);
    expect("created_from" in out && out.created_from !== undefined).toBe(false);
  });

  it("omits lineage when ai_patch_apply but ids missing", () => {
    const out = withAiSaveLineage(base, { created_from: "ai_patch_apply" });
    expect(out).toEqual(base);
  });

  it("merges ai_patch_apply when interaction and patch ids present", () => {
    const out = withAiSaveLineage(base, {
      created_from: "ai_patch_apply",
      related_interaction_id: "int_1",
      related_patch_id: "pat_1",
    });
    expect(out).toMatchObject({
      ...base,
      created_from: "ai_patch_apply",
      related_interaction_id: "int_1",
      related_patch_id: "pat_1",
    });
  });

  it("does not merge manual_save tag alone (no interaction)", () => {
    const out = withAiSaveLineage(base, {
      created_from: "manual_save",
      related_interaction_id: undefined,
      related_patch_id: undefined,
    });
    expect(out).toEqual(base);
  });
});
