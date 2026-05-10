import { config as loadDotenv } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envCandidates = [
  process.env.DOTENV_CONFIG_PATH,
  resolve(__dirname, "../../.env"),
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../.env"),
  resolve(process.cwd(), "../../.env"),
].filter((p): p is string => Boolean(p));

const envFile = envCandidates.find((p) => existsSync(p));
if (envFile) {
  loadDotenv({ path: envFile });
}

export default defineConfig({
  schema: "./src/schema/*.ts",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
