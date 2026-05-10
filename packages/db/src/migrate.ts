import { config as loadDotenv } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

function findEnvFile(): string | null {
  const cliArg = process.argv.find((a) => a.startsWith("--env-file="));
  if (cliArg) {
    const p = resolve(cliArg.slice("--env-file=".length));
    return existsSync(p) ? p : null;
  }
  if (process.env.DOTENV_CONFIG_PATH) {
    const p = resolve(process.env.DOTENV_CONFIG_PATH);
    return existsSync(p) ? p : null;
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(here, "../../../.env"),
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "../.env"),
    resolve(process.cwd(), "../../.env"),
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

async function main() {
  const envFile = findEnvFile();
  if (envFile) {
    loadDotenv({ path: envFile });
    console.log(`[migrate] loaded env from ${envFile}`);
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is required (set it in portal/.env or pass --env-file=path)",
    );
  }

  const client = postgres(url, { max: 1 });
  const db = drizzle(client);

  await migrate(db, { migrationsFolder: "./src/migrations" });
  await client.end();
  console.log("[migrate] done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
