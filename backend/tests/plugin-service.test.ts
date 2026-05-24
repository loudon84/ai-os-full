import { describe, expect, it } from "vitest";

import { buildPluginManifest } from "../src/services/service-center/plugins/plugin.service.js";

describe("buildPluginManifest", () => {
  it("builds plugin manifest from plugin and version", () => {
    const manifest = buildPluginManifest({
      plugin: {
        id: "550e8400-e29b-41d4-a716-446655440020",
        name: "Hermes Connector",
        pluginType: "connector",
        runtime: "copilot-serve",
        entrypoint: "index.js",
        requiredPermissions: ["connector:invoke"],
        configSchema: { api_key: { type: "string" } },
        compatibleProfiles: ["analyst"],
      },
      version: {
        version: "1.0.0",
        checksum: "deadbeef",
      },
    });

    expect(manifest.plugin_id).toBe("550e8400-e29b-41d4-a716-446655440020");
    expect(manifest.version).toBe("1.0.0");
    expect(manifest.runtime).toBe("copilot-serve");
    expect(manifest.checksum).toBe("deadbeef");
  });
});
