#!/usr/bin/env -S node --import tsx
import { spawn } from "node:child_process";
import { existsSync, readdirSync, statSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stdin, stdout } from "node:process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORTAL_ROOT = path.resolve(__dirname, "..");

const envFile = path.join(PORTAL_ROOT, ".env");
if (existsSync(envFile)) {
  const content = readFileSync(envFile, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
}

const mode = process.argv[2] === "watch" ? "watch" : "dev";

const BACKEND_PORT = Number(process.env.BACKEND_PORT ?? "8000");
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT ?? "3000");

const pnpmBin = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const statusDir = path.join(PORTAL_ROOT, ".portal", "dev-status");
const statusFile = path.join(statusDir, "dev-server.json");

interface ChildProcess {
  label: string;
  child: ReturnType<typeof spawn> | null;
  exited: boolean;
}

const processes: ChildProcess[] = [];
let shuttingDown = false;

function log(tag: string, msg: string) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] [${tag}] ${msg}`);
}

function writeStatus(status: Record<string, unknown>) {
  mkdirSync(statusDir, { recursive: true });
  writeFileSync(statusFile, `${JSON.stringify(status, null, 2)}\n`, "utf8");
}

function cleanup() {
  if (shuttingDown) return;
  shuttingDown = true;

  log("portal", "Shutting down...");

  for (const p of processes) {
    if (p.child && !p.exited) {
      p.child.kill("SIGTERM");
    }
  }

  setTimeout(() => {
    for (const p of processes) {
      if (p.child && !p.exited) {
        p.child.kill("SIGKILL");
      }
    }
  }, 5000).unref();

  if (existsSync(statusFile)) {
    const { unlinkSync } = require("node:fs");
    try { unlinkSync(statusFile); } catch {}
  }
}

process.on("SIGINT", () => { cleanup(); process.exit(130); });
process.on("SIGTERM", () => { cleanup(); process.exit(143); });

function spawnProcess(label: string, cmd: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
  const child = spawn(cmd, args, {
    stdio: "inherit",
    env,
    shell: process.platform === "win32",
    cwd: PORTAL_ROOT,
  });

  const entry: ChildProcess = { label, child, exited: false };
  processes.push(entry);

  child.on("exit", (code, signal) => {
    entry.exited = true;
    entry.child = null;

    if (!shuttingDown) {
      log(label, `Process exited (code=${code ?? "null"}, signal=${signal ?? "null"})`);
      cleanup();
      process.exit(code ?? 1);
    }
  });

  child.on("error", (err) => {
    log(label, `Process error: ${err.message}`);
    if (!shuttingDown) {
      cleanup();
      process.exit(1);
    }
  });

  return child;
}

async function maybeRunMigrations() {
  log("portal", "Checking pending migrations...");
  const result = spawn(
    pnpmBin,
    ["--filter", "@portal/db", "exec", "tsx", "src/migrate.ts"],
    { stdio: "inherit", shell: process.platform === "win32", cwd: PORTAL_ROOT },
  );

  return new Promise<void>((resolve) => {
    result.on("exit", (code) => {
      if (code !== 0) {
        log("portal", `Migration check exited with code ${code}, continuing anyway`);
      }
      resolve();
    });
    result.on("error", () => resolve());
  });
}

async function main() {
  log("portal", `Starting portal in ${mode} mode`);
  log("portal", `Root: ${PORTAL_ROOT}`);
  log("portal", `Backend port: ${BACKEND_PORT}, Frontend port: ${FRONTEND_PORT}`);

  writeStatus({
    mode,
    startedAt: new Date().toISOString(),
    backendPort: BACKEND_PORT,
    frontendPort: FRONTEND_PORT,
    pids: {},
  });

  await maybeRunMigrations();

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PORT: String(BACKEND_PORT),
  };

  log("portal", "Starting backend (@portal/server)...");
  spawnProcess("backend", pnpmBin, ["--filter", "@portal/server", mode === "watch" ? "dev" : "dev"], env);

  await new Promise((r) => setTimeout(r, 2000));

  log("portal", "Starting frontend (@portal/web)...");
  const frontendEnv: NodeJS.ProcessEnv = {
    ...env,
    PORT: String(FRONTEND_PORT),
    PORTAL_API_URL: `http://localhost:${BACKEND_PORT}/api/v1`,
  };
  spawnProcess("frontend", pnpmBin, ["--filter", "@portal/web", "dev"], frontendEnv);

  writeStatus({
    mode,
    startedAt: new Date().toISOString(),
    backendPort: BACKEND_PORT,
    frontendPort: FRONTEND_PORT,
    pids: Object.fromEntries(processes.map((p) => [p.label, p.child?.pid ?? null])),
  });

  log("portal", `Portal dev ready — backend :${BACKEND_PORT}, frontend :${FRONTEND_PORT}`);

  await new Promise(() => {});
}

main().catch((err) => {
  console.error(err);
  cleanup();
  process.exit(1);
});
