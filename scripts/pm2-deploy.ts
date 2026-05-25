#!/usr/bin/env -S node --import tsx
/**
 * PM2 部署脚本 - 用于服务器一键启动/重启
 * 
 * 用法:
 *   ppm pm2:start          启动全部服务
 *   pnpm pm2:start backend 只启动 backend
 *   pnpm pm2:start frontend 只启动 frontend
 *   pnpm pm2:restart       重启全部服务
 *   pnpm pm2:restart backend 重启 backend
 *   pnpm pm2:stop          停止全部服务
 *   pnpm pm2:status        查看服务状态
 *   pnpm pm2:logs          查看日志
 */

import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORTAL_ROOT = path.resolve(__dirname, "..");

// 加载 .env 文件
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

const BACKEND_PORT = Number(process.env.BACKEND_PORT ?? "8000");
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT ?? "3000");

const pnpmBin = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

// PM2 应用配置
interface PM2AppConfig {
  name: string;
  script: string;
  cwd: string;
  interpreter?: string;
  node_args?: string;
  env: Record<string, string>;
  instances?: number | "max";
  exec_mode?: "fork" | "cluster";
  watch?: boolean;
  max_memory_restart?: string;
  log_date_format?: string;
  error_file?: string;
  out_file?: string;
  merge_logs?: boolean;
}

function getBackendConfig(): PM2AppConfig {
  return {
    name: "portal-backend",
    script: "dist/index.js",
    cwd: path.join(PORTAL_ROOT, "backend"),
    instances: 1,
    exec_mode: "fork",
    max_memory_restart: "1G",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    error_file: path.join(PORTAL_ROOT, "logs", "backend-error.log"),
    out_file: path.join(PORTAL_ROOT, "logs", "backend-out.log"),
    merge_logs: true,
    env: {
      NODE_ENV: "production",
      PORT: String(BACKEND_PORT),
      DATABASE_URL: process.env.DATABASE_URL ?? "",
    },
  };
}

function getFrontendConfig(): PM2AppConfig {
  return {
    name: "portal-frontend",
    script: "node_modules/next/dist/bin/next",
    cwd: path.join(PORTAL_ROOT, "frontend"),
    node_args: "--max-old-space-size=4096",
    instances: 1,
    exec_mode: "fork",
    max_memory_restart: "2G",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    error_file: path.join(PORTAL_ROOT, "logs", "frontend-error.log"),
    out_file: path.join(PORTAL_ROOT, "logs", "frontend-out.log"),
    merge_logs: true,
    env: {
      NODE_ENV: "production",
      PORT: String(FRONTEND_PORT),
      PORTAL_API_URL: `http://localhost:${BACKEND_PORT}/api/v1`,
    },
  };
}

function log(tag: string, msg: string) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] [${tag}] ${msg}`);
}

function runPM2(args: string[], silent = false): number {
  const result = spawnSync("pm2", args, {
    stdio: silent ? "pipe" : "inherit",
    shell: process.platform === "win32",
    cwd: PORTAL_ROOT,
  });
  return result.status ?? 1;
}

function checkPM2Installed(): boolean {
  const result = spawnSync("pm2", ["--version"], {
    stdio: "pipe",
    shell: process.platform === "win32",
  });
  return result.status === 0;
}

function buildService(service: "backend" | "frontend" | "all"): boolean {
  log("build", `Building ${service}...`);
  
  if (service === "all" || service === "backend") {
    log("build", "Building backend...");
    const result = spawnSync(pnpmBin, ["--filter", "@portal/server", "build"], {
      stdio: "inherit",
      shell: process.platform === "win32",
      cwd: PORTAL_ROOT,
    });
    if (result.status !== 0) {
      log("error", "Backend build failed");
      return false;
    }
  }
  
  if (service === "all" || service === "frontend") {
    log("build", "Building frontend...");
    const result = spawnSync(pnpmBin, ["--filter", "@portal/web", "build"], {
      stdio: "inherit",
      shell: process.platform === "win32",
      cwd: PORTAL_ROOT,
    });
    if (result.status !== 0) {
      log("error", "Frontend build failed");
      return false;
    }
  }
  
  return true;
}

function startService(service: "backend" | "frontend" | "all") {
  const configs: PM2AppConfig[] = [];
  
  if (service === "all" || service === "backend") {
    configs.push(getBackendConfig());
  }
  if (service === "all" || service === "frontend") {
    configs.push(getFrontendConfig());
  }
  
  for (const config of configs) {
    log("pm2", `Starting ${config.name}...`);
    
    // 使用 PM2 start 命令并传入 JSON 配置
    const args = [
      "start",
      config.script,
      "--name", config.name,
      "--cwd", config.cwd,
    ];
    
    if (config.node_args) {
      args.push("--node-args", config.node_args);
    }
    
    if (config.instances) {
      args.push("-i", String(config.instances));
    }
    
    if (config.exec_mode) {
      args.push("--exec-mode", config.exec_mode);
    }
    
    if (config.max_memory_restart) {
      args.push("--max-memory-restart", config.max_memory_restart);
    }
    
    if (config.log_date_format) {
      args.push("--log-date-format", `"${config.log_date_format}"`);
    }
    
    if (config.error_file) {
      args.push("--error", config.error_file);
    }
    
    if (config.out_file) {
      args.push("--output", config.out_file);
    }
    
    if (config.merge_logs) {
      args.push("--merge-logs");
    }
    
    // 添加环境变量
    for (const [key, value] of Object.entries(config.env)) {
      if (value) {
        args.push("--env", `${key}=${value}`);
      }
    }
    
    const code = runPM2(args);
    if (code !== 0) {
      log("error", `Failed to start ${config.name}`);
    }
  }
  
  log("pm2", "Services started. Run 'pnpm pm2:status' to check status.");
}

function restartService(service: "backend" | "frontend" | "all") {
  const names: string[] = [];
  
  if (service === "all" || service === "backend") {
    names.push("portal-backend");
  }
  if (service === "all" || service === "frontend") {
    names.push("portal-frontend");
  }
  
  for (const name of names) {
    log("pm2", `Restarting ${name}...`);
    const code = runPM2(["restart", name]);
    if (code !== 0) {
      log("error", `Failed to restart ${name}`);
    }
  }
  
  log("pm2", "Services restarted.");
}

function stopService(service: "backend" | "frontend" | "all") {
  const names: string[] = [];
  
  if (service === "all" || service === "backend") {
    names.push("portal-backend");
  }
  if (service === "all" || service === "frontend") {
    names.push("portal-frontend");
  }
  
  for (const name of names) {
    log("pm2", `Stopping ${name}...`);
    const code = runPM2(["stop", name]);
    if (code !== 0) {
      log("error", `Failed to stop ${name}`);
    }
  }
  
  log("pm2", "Services stopped.");
}

function showStatus() {
  runPM2(["list"]);
}

function showLogs(service: "backend" | "frontend" | "all") {
  const names: string[] = [];
  
  if (service === "all" || service === "backend") {
    names.push("portal-backend");
  }
  if (service === "all" || service === "frontend") {
    names.push("portal-frontend");
  }
  
  runPM2(["logs", ...names]);
}

function printUsage() {
  console.log(`
PM2 部署脚本 - 用于服务器一键启动/重启

用法:
  pnpm pm2:start [service]     启动服务 (默认: all)
  pnpm pm2:restart [service]   重启服务 (默认: all)
  pnpm pm2:stop [service]      停止服务 (默认: all)
  pnpm pm2:status              查看服务状态
  pnpm pm2:logs [service]      查看日志 (默认: all)
  pnpm pm2:build [service]     构建服务 (默认: all)

参数:
  service: backend | frontend | all (默认: all)

示例:
  pnpm pm2:start              启动全部服务
  pnpm pm2:start backend      只启动 backend
  pnpm pm2:restart frontend   重启 frontend
  pnpm pm2:stop               停止全部服务
  pnpm pm2:status             查看状态
  pnpm pm2:logs backend       查看 backend 日志

环境变量:
  BACKEND_PORT   后端端口 (默认: 8000)
  FRONTEND_PORT  前端端口 (默认: 3000)
  DATABASE_URL   数据库连接串
`);
}

function parseService(arg: string | undefined): "backend" | "frontend" | "all" {
  if (arg === "backend" || arg === "frontend" || arg === "all") {
    return arg;
  }
  return "all";
}

function main() {
  const command = process.argv[2];
  const serviceArg = process.argv[3];
  
  if (!checkPM2Installed()) {
    log("error", "PM2 is not installed. Please install it first: npm install -g pm2");
    process.exit(1);
  }
  
  switch (command) {
    case "start": {
      const service = parseService(serviceArg);
      log("deploy", `Starting ${service} service(s)...`);
      startService(service);
      break;
    }
    
    case "restart": {
      const service = parseService(serviceArg);
      log("deploy", `Restarting ${service} service(s)...`);
      restartService(service);
      break;
    }
    
    case "stop": {
      const service = parseService(serviceArg);
      log("deploy", `Stopping ${service} service(s)...`);
      stopService(service);
      break;
    }
    
    case "status": {
      showStatus();
      break;
    }
    
    case "logs": {
      const service = parseService(serviceArg);
      showLogs(service);
      break;
    }
    
    case "build": {
      const service = parseService(serviceArg);
      log("deploy", `Building ${service} service(s)...`);
      const success = buildService(service);
      process.exit(success ? 0 : 1);
      break;
    }
    
    case "help":
    case "--help":
    case "-h":
    default:
      printUsage();
      break;
  }
}

main();
