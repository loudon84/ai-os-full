```markdown
# hermes-desktop Project Semantic Overview

## Purpose

hermes-desktop is a cross-platform Electron shell that exposes the Python-based `hermes-agent` backend as a native desktop application. It is **not** an AI agent itself — it is a configuration, orchestration, and chat UI that delegates all intelligence to a local or remote `hermes-agent` process. The desktop app owns: window lifecycle, IPC routing, file-system data management, process spawning, and the React UI. It does **not** own: LLM inference, tool execution, memory retrieval, or gateway protocol logic — those belong to the Python backend.

---

## Core Architecture

Three strictly separated Electron processes plus one external Python process:

**Renderer Process** (`src/renderer/src/`) — React SPA. Has zero Node.js access. All data flows through `window.hermesAPI`. Owns UI state, view routing, and streaming display.

**Preload Bridge** (`src/preload/index.ts`) — The sole security boundary. Exposes `hermesAPI` via `contextBridge.exposeInMainWorld`. This object is the **complete and authoritative contract** between UI and main process. Every renderer capability must be declared here first.

**Main Process** (`src/main/index.ts`) — Privileged Node.js environment. Registers all `ipcMain.handle` handlers in `setupIPC()`. Delegates to domain modules. Owns the `currentChatAbort` handle and the `mainWindow` reference.

**Python Gateway** (`~/.hermes/venv/bin/python`) — External process managed by `src/main/hermes.ts`. Communicates over HTTP SSE on `127.0.0.1:8642`. The desktop treats it as a black box accessed via `/v1/chat/completions`.

---

## Key Modules

`src/main/index.ts` — Single IPC registration hub. All `ipcMain.handle` calls live here. Adding a new backend capability requires: (1) implement in a domain module, (2) register handler here, (3) expose in preload.

`src/main/hermes.ts` — Gateway lifecycle (`startGateway`, `stopGateway`, `restartGateway`) and message routing (`sendMessage` → `sendMessageViaApi`). Owns the dual-path model: HTTP SSE fast path vs. CLI fallback. Polls `/health` via `isApiServerReady()`.

`src/main/installer.ts` — One-time environment bootstrap. Manages `HERMES_HOME` (`~/.hermes`), Python venv creation, dependency installation, `runHermesDoctor`, `runHermesUpdate`, backup/import/dump, MCP server discovery, memory provider discovery, and log reading.

`src/main/config.ts` — Profile-aware read/write for `.env` and `config.yaml`. Uses a 5000ms TTL in-memory cache to minimize disk I/O. Owns credential pool, model config, connection config (local vs. remote), and platform toggles.

`src/main/utils.ts` — `profileHome(profile?)` is the single routing function for all file-system paths. Default profile → `~/.hermes/`. Named profile → `~/.hermes/profiles/<name>/`. Every data module must call this; bypassing it breaks profile isolation.

`src/main/sessions.ts` — SQLite `state.db` access. Full-text search via FTS5 on `messages_fts` table.

`src/main/session-cache.ts` — `sessions.json` fast cache in `~/.hermes/desktop/`. Delta sync via `syncSessionCache()` to avoid O(N²) reads. Auto-generates titles from first user message.

`src/main/profiles.ts` — Profile CRUD. Detects profile directories even without initial config. Active profile tracked via a marker file.

`src/main/memory.ts` — `MEMORY.md` flat-file store. Entries delimited by `§`. Hard cap at 2200 characters total to protect context window budget.

`src/main/soul.ts` — `SOUL.md` read/write/reset. Defines the agent's system prompt identity.

`src/main/tools.ts` — Feature flags for agent toolsets (`web`, `terminal`, `memory`, etc.) stored under `platform_toolsets.cli` in `config.yaml`.

`src/main/skills.ts` — Modular capability packages. Discovered by parsing `SKILL.md` frontmatter. Organized by category path (e.g., `skills/web/search`).

`src/main/cronjobs.ts` — Scheduled task CRUD persisted in `jobs.json`. Jobs target delivery channels and can carry skill overrides.

`src/main/claw3d.ts` — Manages the Claw3D 3D office integration: Git clone, NPM install, dev server, WebSocket adapter. Entirely optional subsystem.

`src/main/models.ts` — User-defined model library (name, provider, model ID, baseUrl). Persisted separately from active model config.

`src/preload/index.ts` — Defines the full `hermesAPI` surface: ~60 typed invoke wrappers and ~12 event listener registrations. All listeners return an unsubscribe function — callers must invoke it on unmount.

`src/renderer/src/screens/Layout/Layout.tsx` — Root UI orchestrator. Manages `view` state (13 views), active profile, session resume, auto-update status bar, and remote-mode overlay injection.

`src/shared/i18n/` — `i18next` instance (`sharedI18n`) shared across processes. Four locales: `en`, `es`, `pt-BR`, `zh-CN`. Namespaced into 20+ translation files per locale.

---

## Lifecycle

1. **App Ready** — `app.whenReady()` fires: `buildMenu()` → `setupIPC()` → `createWindow()` → `setupUpdater()`
2. **Renderer Boot** — React mounts, calls `hermesAPI.checkInstall()` → routes to `splash` → `welcome` → `installing` → `setup` → `chat` based on install state
3. **Install Phase** — `runInstall()` bootstraps `~/.hermes` venv; progress streamed via `install-progress` IPC push events
4. **Gateway Start** — Lazy-started on first `send-message` if not remote mode; `startGateway()` spawns Python process, polls `/health`
5. **Chat Loop** — `sendMessage` → HTTP POST SSE stream → `chat-chunk` / `chat-tool-progress` / `chat-usage` / `chat-done` push events → renderer assembles response
6. **Config Change** — Any API key, model, or platform toggle change triggers `restartGateway()` automatically
7. **Shutdown** — `before-quit`: `stopHealthPolling()` → abort in-flight chat → `stopGateway()` → `stopClaw3d()`

---

## Extension Points

**New IPC capability**: implement domain logic in a `src/main/*.ts` module → register `ipcMain.handle("channel-name", ...)` in `setupIPC()` in `src/main/index.ts` → expose typed wrapper in `src/preload/index.ts` → add TypeScript declaration in `src/preload/index.d.ts`.

**New UI screen**: add a value to the `View` union type in `Layout.tsx` → add a nav item to `NAV_ITEMS` → add a render branch in the view switch → create screen component under `src/renderer/src/screens/`.

**New locale**: add locale code to `AppLocale` union in `src/shared/i18n/types.ts` → create locale directory under `src/shared/i18n/locales/<code>/` mirroring the `en` namespace structure → register in the `resources` object in `src/shared/i18n/index.ts`.

**New skill**: create a directory under `~/.hermes/skills/<category>/<name>/` containing a `SKILL.md` with valid frontmatter. Bundled skills ship inside the app resources and are listed by `listBundledSkills()`.

**New agent profile**: profiles are directory-isolated. All data modules accept an optional `profile?: string` parameter routed through `profileHome()`. New profile-scoped features must pass this parameter through the full IPC stack.

**Gateway config injection**: `src/main/hermes.ts` injects required `api_server` settings into `config.yaml` before starting. Add new required config keys here, not in the installer.

---

## Constraints and Invariants

**IPC is the only legal cross-process channel.** The renderer must never access Node.js APIs directly. `sandbox: false` is set only to enable the preload bridge — it does not grant renderer Node.js access.

**`profileHome()` must be called for every file-system operation.** Hardcoding `~/.hermes` paths in domain modules breaks multi-profile isolation.

**`hermesAPI` is the complete renderer API surface.** Any capability not declared in `src/preload/index.ts` is inaccessible to the renderer. The preload file is the single source of truth for what the UI can do.

**Gateway restart is required after config mutations.** `set-env` (for `*_API_KEY` / `*_TOKEN`), `set-model-config`, and `set-platform-enabled` all call `restartGateway()` automatically. New config-mutating handlers must replicate this pattern.

**Memory entries are capped at 2200 characters total** across all entries in `MEMORY.md`. Entries are `§`-delimited. Do not change the delimiter without migrating existing data.

**SSE stream events are push-only from main to renderer.** Chat streaming uses `event.sender.send(channel, data)` from inside `ipcMain.handle`. The renderer subscribes via `hermesAPI.onChatChunk(cb)` and must call the returned unsubscribe function on component unmount to prevent listener leaks.

**`webviewTag: true` is required for the Claw3D Office screen.** This is set at window creation and cannot be toggled at runtime. The Office screen uses a `<webview>` element, not an iframe.

**Auto-update is disabled in dev mode.** `setupUpdater()` short-circuits when `!app.isPackaged`. IPC handlers are still registered (returning no-ops) to prevent invoke errors from the renderer.

**TypeScript strict mode is enforced** across all three tsconfig targets (`tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json`). Do not introduce `any` casts in the IPC layer — the preload type declarations in `src/preload/index.d.ts` are the runtime contract.

---

## Storage Layout

```
~/.hermes/                    ← HERMES_HOME (default profile root)
  config.yaml                 ← model provider, toolsets, api_server config
  .env                        ← API keys and tokens
  state.db                    ← SQLite: sessions + FTS5 messages_fts
  SOUL.md                     ← agent persona / system prompt
  memories/MEMORY.md          ← §-delimited long-term memory entries
  skills/<category>/<name>/   ← installed skill packages
  jobs.json                   ← cron job definitions
  desktop/sessions.json       ← fast session title cache
  profiles/<name>/            ← named profile, same structure as root
```

---

## What This System Is Not

- Not an LLM runtime — inference happens in the Python backend
- Not a plugin host — skills are Python-side capabilities, not Electron extensions
- Not a web app — it is a packaged Electron binary; no server-side rendering, no HTTP serving to external clients
- Not a multi-window app — single `BrowserWindow` instance; Claw3D uses an embedded `<webview>`, not a second window
``` [1](#0-0) [2](#0-1) [3](#0-2) [4](#0-3) [5](#0-4)

### Citations

**File:** src/preload/index.ts (L1-11)
```typescript
import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import type { AppLocale } from "../shared/i18n/types";

const hermesAPI = {
  // Installation
  checkInstall: (): Promise<{
    installed: boolean;
    configured: boolean;
    hasApiKey: boolean;
  }> => ipcRenderer.invoke("check-install"),
```

**File:** src/preload/index.ts (L638-650)
```typescript
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("hermesAPI", hermesAPI);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.hermesAPI = hermesAPI;
}
```

**File:** src/main/index.ts (L183-200)
```typescript
function setupIPC(): void {
  // Installation
  ipcMain.handle("check-install", () => {
    return checkInstallStatus();
  });

  ipcMain.handle("verify-install", () => verifyInstall());

  ipcMain.handle("start-install", async (event) => {
    try {
      await runInstall((progress: InstallProgress) => {
        event.sender.send("install-progress", progress);
      }, mainWindow);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });
```

**File:** src/main/index.ts (L320-403)
```typescript
  // Chat — lazy-start gateway on first message
  ipcMain.handle(
    "send-message",
    async (
      event,
      message: string,
      profile?: string,
      resumeSessionId?: string,
      history?: Array<{ role: string; content: string }>,
    ) => {
      if (!isRemoteMode() && !isGatewayRunning()) {
        startGateway(profile);
      }

      if (currentChatAbort) {
        currentChatAbort();
      }

      let fullResponse = "";
      const chatStartTime = Date.now();
      let resolveChat: (v: { response: string; sessionId?: string }) => void;
      let rejectChat: (reason?: unknown) => void;
      const promise = new Promise<{ response: string; sessionId?: string }>(
        (res, rej) => {
          resolveChat = res;
          rejectChat = rej;
        },
      );

      const handle = await sendMessage(
        message,
        {
          onChunk: (chunk) => {
            fullResponse += chunk;
            event.sender.send("chat-chunk", chunk);
          },
          onDone: (sessionId) => {
            currentChatAbort = null;
            event.sender.send("chat-done", sessionId || "");
            resolveChat({ response: fullResponse, sessionId });
            // Desktop notification when window is not focused and response took >10s
            if (
              mainWindow &&
              !mainWindow.isFocused() &&
              Date.now() - chatStartTime > 10000
            ) {
              const preview = fullResponse
                .replace(/[#*_`~\n]+/g, " ")
                .trim()
                .slice(0, 80);
              new Notification({
                title: "Hermes Agent",
                body: preview || "Response ready",
              }).show();
            }
          },
          onError: (error) => {
            currentChatAbort = null;
            event.sender.send("chat-error", error);
            rejectChat(new Error(error));
            // Notify on error too if window not focused
            if (mainWindow && !mainWindow.isFocused()) {
              new Notification({
                title: "Hermes Agent — Error",
                body: error.slice(0, 100),
              }).show();
            }
          },
          onToolProgress: (tool) => {
            event.sender.send("chat-tool-progress", tool);
          },
          onUsage: (usage) => {
            event.sender.send("chat-usage", usage);
          },
        },
        profile,
        resumeSessionId,
        history,
      );

      currentChatAbort = handle.abort;
      return promise;
    },
  );
```

**File:** src/main/index.ts (L845-879)
```typescript
app.whenReady().then(() => {
  app.name = "Hermes";
  electronApp.setAppUserModelId("com.nousresearch.hermes");

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  buildMenu();
  setupIPC();
  createWindow();
  setupUpdater();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    stopGateway();
    stopClaw3d();
    app.quit();
  }
});

app.on("before-quit", () => {
  stopHealthPolling();
  if (currentChatAbort) {
    currentChatAbort();
    currentChatAbort = null;
  }
  stopGateway();
  stopClaw3d();
});
```
