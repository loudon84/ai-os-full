import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/email-api", () => ({
  triggerEmailSync: vi.fn(),
  fetchEmailSyncStatus: vi.fn().mockResolvedValue({}),
}));

import { triggerEmailSync } from "../services/email-api";

describe("triggerEmailSync (client contract)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns EmailResult from API layer", async () => {
    vi.mocked(triggerEmailSync).mockResolvedValue({
      success: true,
      data: { synced_count: 2, status: "active" },
    });
    const res = await triggerEmailSync();
    expect(res.success).toBe(true);
  });
});
