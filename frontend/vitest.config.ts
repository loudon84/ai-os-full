import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@portal/shared": path.resolve(__dirname, "../packages/shared/src"),
      "@portal/shared/*": path.resolve(__dirname, "../packages/shared/src/*"),
    },
  },
  test: {
    environment: "node",
    include: ["modules/**/*.test.ts"],
  },
});
