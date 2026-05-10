# Hermes Web UI — Project Semantic Overview

## Purpose

`hermes-webui` is a **self-hosted browser frontend for the `hermes-agent` CLI**. It is not a standalone chat app — it is a thin HTTP wrapper that translates browser interactions into `AIAgent.run_conversation()` calls and streams results back via SSE. Every feature maps 1:1 to a CLI capability. The system has no independent LLM access; all intelligence comes from the agent process.

---

## Core Architecture

```
Browser (Vanilla JS SPA)
  └─ 6 <script> modules, no bundler, no framework
  └─ Global state: S{} in ui.js

Python HTTP Layer
  └─ server.py          — ThreadingHTTPServer shell, auth middleware, profile cookie
  └─ api/routes.py      — flat if/elif GET + POST dispatch (~3100 lines)
  └─ api/*.py           — business logic modules

Agent Bridge
  └─ api/streaming.py   — SSE engine + AIAgent invocation in daemon threads
  └─ run_agent.AIAgent  — imported from hermes-agent on sys.path (not a package dep)

Filesystem State
  └─ ~/.hermes/webui/sessions/{id}.json   — one file per session
  └─ ~/.hermes/webui/sessions/_index.json — O(1) session list index
  └─ ~/.hermes/webui/settings.json        — user preferences
  └─ ~/.hermes/{profile}/state.db         — CLI SQLite (read-only bridge)
``` [1](#0-0) [2](#0-1) 

---

## Key Modules

**`server.py`** — Entry point only. Instantiates `QuietHTTPServer`, reads `hermes_profile` cookie per request, calls `check_auth`, dispatches to `handle_get`/`handle_post`, clears profile context in `finally`. ~196 lines. [3](#0-2) 

**`api/config.py`** — Single source of truth for all constants, global mutable state (`SESSIONS`, `STREAMS`, `CANCEL_FLAGS`, `LOCK`, `STREAMS_LOCK`), env-var resolution, agent directory discovery, model detection, settings load/save. All other modules import from here. [4](#0-3) 

**`api/routes.py`** — All HTTP handlers. `handle_get(handler, parsed)` and `handle_post(handler, parsed)` return `True` (handled) or `False` (404). CSRF check runs at top of `handle_post`. Upload check must precede `read_body()`. [5](#0-4) [6](#0-5) 

**`api/models.py`** — `Session` class (plain Python, not ORM). `save()` writes `__dict__` as JSON and patches `_index.json`. `get_session()` uses LRU `OrderedDict` cache (cap 100). `get_cli_sessions()` reads `state.db` via SQLite bridge. [7](#0-6) 

**`api/streaming.py`** — SSE engine. `_run_agent_streaming()` runs in a daemon thread, writes to `queue.Queue` in `STREAMS[stream_id]`. Handles token/tool/reasoning/approval/clarify/done/error/cancel events. Also owns LLM-based session title generation. [8](#0-7) 

**`api/profiles.py`** — Profile switching. Process-global `_active_profile` + per-request thread-local `_tls`. `set_request_profile()` / `clear_request_profile()` called by `server.py` around every request. [9](#0-8) 

**`api/helpers.py`** — `j()`, `t()`, `bad()`, `require()`, `safe_resolve()`, `read_body()`, `redact_session_data()`, `get_profile_cookie()`. All responses go through `j()` or `t()` which call `_security_headers()`. [10](#0-9) 

**`static/ui.js`** — Global state `S`, `INFLIGHT`, `SESSION_QUEUES`. All DOM helpers, `renderMd()`, `renderMessages()`, model dropdown, tool card rendering. First module loaded; all others depend on it. [11](#0-10) 

**`static/messages.js`** — `send()`, SSE `EventSource` lifecycle, approval card, clarify dialog. The critical `activeSid` guard lives here.

**`static/boot.js`** — Event wiring IIFE, workspace panel state machine, mobile nav, voice input, cancel stream. Runs last. [12](#0-11) 

**`static/panels.js`** — Cron, skills, memory, profiles, settings, todo panels. All sidebar panel logic.

**`static/sessions.js`** — Session CRUD, list rendering, search, project picker, SVG icons.

---

## Lifecycle

1. **Bootstrap** — `bootstrap.py` / `start.sh` discovers agent dir, installs deps, waits for health, opens browser.
2. **Server init** — `server.py:main()` calls `print_startup_config()`, `fix_credential_permissions()`, `verify_hermes_imports()`, creates state dirs, starts `gateway_watcher`, wraps socket with TLS if configured.
3. **Per-request** — `Handler.do_GET/do_POST` reads `hermes_profile` cookie → `set_request_profile()` → `check_auth()` → `handle_get/post()` → `clear_request_profile()` in `finally`.
4. **Chat turn** — Browser POSTs `/api/chat/start` → server creates `queue.Queue`, spawns daemon thread running `_run_agent_streaming()`, returns `{stream_id}` → browser opens `EventSource(/api/chat/stream?stream_id=X)` → SSE loop drains queue until `done`/`error`/`cancel`.
5. **Agent run** — `_run_agent_streaming()` sets thread-local + process-global env vars, constructs `AIAgent`, calls `agent.run_conversation(user_message=..., conversation_history=..., task_id=session_id)`, puts events into queue, restores env in `finally`.
6. **Title generation** — After `done`, a background thread calls LLM (via active agent or `agent.auxiliary_client`) to generate a session title, emits `title_status` + `title` SSE events, then emits `stream_end`. [13](#0-12) 

---

## SSE Event Contract

| Event | Data shape | Consumer |
|---|---|---|
| `token` | `{text}` | `messages.js` appends to assistant row |
| `reasoning` | `{text}` | `messages.js` appends to reasoning card |
| `tool` | `{name, preview, args, tid, event_type}` | `messages.js` sets composer status |
| `approval` | `{command, description, pattern_keys, approval_id}` | `messages.js` shows approval card |
| `clarify` | `{question, choices_offered, session_id}` | `messages.js` shows clarify dialog |
| `done` | `{session: {compact + messages + tool_calls}}` | `messages.js` syncs `S`, re-renders |
| `error` | `{message, trace}` | `messages.js` shows error |
| `cancel` | `{message}` | `messages.js` clears busy state |
| `title` | `{session_id, title}` | `sessions.js` updates sidebar |
| `title_status` | `{session_id, status, reason, title}` | diagnostic only |
| `stream_end` | `{session_id}` | `messages.js` closes EventSource | [14](#0-13) 

---

## Extension Points

**New API endpoint** — Add an `if parsed.path == '/api/...'` branch in `handle_get` or `handle_post` in `api/routes.py`. POST handlers: add AFTER the `/api/upload` check and AFTER `body = read_body(handler)`. Use `require()`, `bad()`, `j()` from `api/helpers.py`. [15](#0-14) 

**New SSE event type** — Add `put('event_name', {...})` in `_run_agent_streaming()` in `api/streaming.py`. Add handler in `messages.js` `es.addEventListener('event_name', ...)`.

**New sidebar panel** — Add panel HTML to `static/index.html`, add `switchPanel('name')` case in `panels.js`, add nav tab in sidebar.

**New model** — Add entry to `MODEL_LABELS` dict in `static/ui.js` and add `<option>` to `#modelSelect` in `static/index.html`. [16](#0-15) 

**New agent toolset** — Modify `CLI_TOOLSETS` in `api/config.py` or `~/.hermes/config.yaml` under `platform_toolsets.cli`.

---

## Invariants — Must Not Violate

**Upload ordering** — In `handle_post`, the `/api/upload` branch MUST appear before `read_body()`. `read_body()` consumes `rfile`; the multipart upload handler also needs `rfile`. Reversing this silently breaks all file uploads. [17](#0-16) 

**`AIAgent.run_conversation()` keyword** — The session ID parameter is `task_id=session_id`, NOT `session_id=`. Using the wrong keyword silently passes `None` as task_id. [18](#0-17) 

**`deleteSession()` never creates** — `deleteSession()` in `sessions.js` must never call `newSession()`. If deleted session was active and others exist: load `sessions[0]`. If none remain: show empty state. [19](#0-18) 

**`send()` session guard** — `activeSid` must be captured before any `await` in `send()`. After agent completes, check `S.session.session_id === activeSid` before applying results. If mismatch (user switched sessions mid-flight), only refresh sidebar; do NOT call `setBusy(false)` on the new session. [20](#0-19) 

**Approval state is in-process only** — `tools/approval._pending` is a module-level dict shared across threads via Python's import cache. It breaks if the approval module is ever imported in a subprocess or via `importlib.reload()`. [21](#0-20) 

**`safe_resolve()` for all file ops** — Every filesystem read/write that takes user-supplied paths must go through `safe_resolve(root, requested)` in `api/helpers.py`. It calls `.relative_to(root)` to block path traversal. [22](#0-21) 

**Session ID validation** — `Session.load()` validates `sid` against `[0-9a-z_]` before constructing the path. Any new code that constructs session file paths must apply the same check. [23](#0-22) 

**No native dialogs** — `confirm()` and `prompt()` are banned. Use `showConfirmDialog()` and `showPromptDialog()` from `ui.js`. [24](#0-23) 

---

## Concurrency Model

- `ThreadingHTTPServer`: each HTTP request runs in its own thread (unbounded pool).
- `SESSIONS` (`OrderedDict`, cap 100): protected by `LOCK` (threading.Lock).
- `STREAMS` (`dict`): protected by `STREAMS_LOCK`.
- Agent runs: one per session enforced by `_get_session_agent_lock(session_id)`.
- Env vars (`TERMINAL_CWD`, `HERMES_EXEC_ASK`, `HERMES_SESSION_KEY`, `HERMES_HOME`): set via `_set_thread_env()` (thread-local) AND `os.environ` (process-global fallback). Two concurrent sessions on different session IDs can still clobber each other's `os.environ`. This is a known partial fix (TD1). Safe only for single-user use.
- `_ENV_LOCK` serializes the `os.environ` save/restore block around agent runs. [25](#0-24) [26](#0-25) 

---

## Constraints and Assumptions

- **Single-user, single-concurrent-request** — the env-var concurrency model is safe only under this assumption.
- **hermes-agent on sys.path** — `run_agent.AIAgent` is imported directly; the agent must be a sibling checkout or at a discoverable path. No PyPI package.
- **No build step** — JS modules are loaded as plain `<script>` tags in dependency order. No ES modules, no `import`/`export`. All functions are global.
- **No frontend tests** — all 1353+ tests are Python HTTP integration tests via `pytest`. Frontend correctness is manual.
- **State dir never inside repo** — `STATE_DIR` defaults to `~/.hermes/webui/`. Tests use an isolated dir derived from a hash of the repo path.
- **Approval module shared via import cache** — moving to multi-process (gunicorn) or subprocess would break the approval system.
- **`renderMd()` is hand-rolled** — known gaps: nested lists, mixed bold+link. Do not rely on it for complex markdown; replacing with `marked.js` is a future option. [27](#0-26) [28](#0-27) 

---

## Risky Modification Areas

- **`api/routes.py` POST ordering** — inserting a new branch before `/api/upload` or before `read_body()` will silently break uploads or the new endpoint.
- **`api/config.py` global state** — `SESSIONS`, `STREAMS`, `CANCEL_FLAGS`, `LOCK` are shared across all threads. Mutations outside lock blocks cause race conditions.
- **`api/streaming.py` env var save/restore** — the `_ENV_LOCK` + `finally` block that restores `os.environ` is fragile. Any early `return` before the `finally` block must be inside the `try`.
- **`api/profiles.py` `_DEFAULT_HERMES_HOME`** — computed at module import time. If `HERMES_HOME` is mutated before import (e.g., in tests), the base home resolves incorrectly. The `_resolve_base_hermes_home()` guard handles this but is subtle.
- **`static/ui.js` load order** — `ui.js` must be first. `boot.js` must be last. Reordering `<script>` tags in `index.html` breaks the entire frontend.
- **Session index** — `_write_session_index()` uses `os.replace()` for atomic writes. Any code that writes directly to `_index.json` without the lock or without atomic replace will corrupt the index. [29](#0-28) [17](#0-16)

### Citations

**File:** ARCHITECTURE.md (L31-34)
```markdown
The design philosophy is deliberately minimal. There is no build step, no bundler, no
frontend framework. The Python server is split into a routing shell (server.py) and
business logic modules (api/). The frontend is seven vanilla JS modules loaded from static/.
This makes the code easy to modify from a terminal or by an agent.
```

**File:** ARCHITECTURE.md (L113-117)
```markdown
- Python interpreter: <agent-dir>/venv/bin/python
- The venv has all Hermes agent dependencies (run_agent, tools/*, cron/*)
- Server binds to 127.0.0.1:8787 (localhost only, not public internet)
- Access from Mac: SSH tunnel: ssh -N -L 8787:127.0.0.1:8787 <user>@<your-server>
- The server imports Hermes modules via sys.path.insert(0, parent_dir)
```

**File:** ARCHITECTURE.md (L148-153)
```markdown
                         Saved and restored around each agent run.

WARNING: These env vars are process-global. Two concurrent chat requests will clobber
each other. This is safe only for single-user, single-concurrent-request use.
See Architecture Phase B for the fix.

```

**File:** ARCHITECTURE.md (L177-182)
```markdown
CRITICAL ORDERING RULE in do_POST:
The /api/upload check MUST appear BEFORE calling read_body(). read_body() calls
handler.rfile.read() which consumes the HTTP body stream. The upload handler also
needs rfile (to read the multipart payload). If read_body() runs first on a multipart
request, the upload handler receives an empty body and the upload silently fails.

```

**File:** ARCHITECTURE.md (L238-258)
```markdown
SSE event types and their data shapes:

    token       {"text": "..."}                         LLM token delta
    tool        {"name": "...", "preview": "..."}       Tool invocation started
    approval    {"command": "...", "description": "...", "pattern_keys": [...]}
    done        {"session": {compact_fields + messages}} Agent finished successfully
    error       {"message": "...", "trace": "..."}       Agent threw exception

The SSE handler loop:
    - Blocks on queue.get(timeout=30)
    - On timeout (no events in 30s): sends a heartbeat comment (": heartbeat

")
      to keep the connection alive through proxies and firewalls
    - On 'done' or 'error' event: breaks the loop and returns
    - Catches BrokenPipeError and ConnectionResetError silently (browser disconnected)

Stream cleanup: _run_agent_streaming() pops its stream_id from STREAMS in a finally
block. If the browser disconnects mid-stream, the daemon thread runs to completion and
then cleans up. The queue fills and the put_nowait() calls fail silently (queue.Full
is caught).
```

**File:** ARCHITECTURE.md (L275-278)
```markdown
4. Calls agent.run_conversation(user_message=msg_text, conversation_history=s.messages,
                                 task_id=session_id)
   NOTE: keyword is task_id NOT session_id (common mistake, documented in skill)
5. On return: updates s.messages, calls title_from(), saves session
```

**File:** ARCHITECTURE.md (L299-312)
```markdown
All state lives in module-level variables in that file:

    _pending = {}        dict: session_key -> pending_entry_dict
    _lock = Lock()       protects _pending
    _permanent_approved  set of permanently approved pattern keys

Because server.py imports tools.approval at module load time and everything runs in the
same process, this state IS shared between HTTP threads and agent daemon threads.

Important: this only works because Python imports are cached (sys.modules). The same
module object is used everywhere. If the approval module were ever imported in a subprocess
or via importlib.reload(), this would break.

GET /api/approval/pending:
```

**File:** ARCHITECTURE.md (L369-380)
```markdown
The frontend is served from static/ as separate files: one HTML template, one CSS file,
and six JavaScript modules (~2,786 lines total). External dependencies: Prism.js (syntax
highlighting) and Mermaid.js (diagrams) from CDN, both loaded async/deferred with SRI hashes.

Six JS modules loaded in order at end of <body>:
  1. ui.js       (~846 lines) DOM helpers, renderMd, tool card rendering, global state
  2. workspace.js (~169 lines) File tree, preview, file operations
  3. sessions.js  (~532 lines) Session CRUD, list rendering, search, SVG icons, dropdown actions, project picker
  4. messages.js  (~293 lines) send(), SSE event handlers, approval, transcript
  5. panels.js    (~771 lines) Cron, skills, memory, workspace, todo, switchPanel
  6. boot.js      (~175 lines) Event wiring + boot IIFE

```

**File:** ARCHITECTURE.md (L452-456)
```markdown
Dialog policy:
    Native browser confirm()/prompt() are not used in the Web UI.
    Destructive actions use showConfirmDialog(...), then a toast on success.
    Lightweight naming flows (new file/folder/project) use showPromptDialog(...).

```

**File:** ARCHITECTURE.md (L511-523)
```markdown
B3 was resolved in Sprint 1. Current code uses a MODEL_LABELS dict:

    const MODEL_LABELS = {
      'openai/gpt-5.4-mini': 'GPT-5.4 Mini', 'openai/gpt-4o': 'GPT-4o',
      'openai/o3': 'o3', 'openai/o4-mini': 'o4-mini',
      'anthropic/claude-sonnet-4.6': 'Sonnet 4.6', 'anthropic/claude-sonnet-4-5': 'Sonnet 4.5',
      'anthropic/claude-haiku-3-5': 'Haiku 3.5', 'google/gemini-2.5-pro': 'Gemini 2.5 Pro',
      'deepseek/deepseek-chat-v3-0324': 'DeepSeek V3', 'meta-llama/llama-4-scout': 'Llama 4 Scout',
    };
    getModelLabel(m) => MODEL_LABELS[m] || (m.split('/').pop() || 'Unknown');

Fallback: any unlisted model shows its short ID (after the last /) rather than a wrong label.
To add a new model: add an entry to MODEL_LABELS and add an <option> to the composer footer <select>.
```

**File:** ARCHITECTURE.md (L526-534)
```markdown

These rules are critical. GPT-5.4-mini has repeatedly re-introduced broken versions.

1. deleteSession() NEVER calls newSession(). Deleting does not create.
2. If deleted session was active AND other sessions exist: load sessions[0] (most recent).
3. If deleted session was active AND no sessions remain: show empty state.
4. If deleted session was not active: just re-render the list.
5. Always show toast("Conversation deleted") after any delete.

```

**File:** ARCHITECTURE.md (L536-551)
```markdown

Before any async operations in send():
    const activeSid = S.session.session_id;

After the agent completes:
    if (S.session && S.session.session_id === activeSid) {
      // apply result, re-render
      setBusy(false);
    } else {
      // user switched sessions mid-flight
      // only refresh sidebar, do NOT call setBusy(false) on the new session
      await renderSessionList();
    }

This prevents a session switch mid-flight from either clobbering the new session's state
or unlocking the Send button on the wrong session.
```

**File:** ARCHITECTURE.md (L557-588)
```markdown
Step-by-step trace of what happens when you type a message and press Send:

1.  User types, presses Enter. send() is called.
2.  Guard: return if (!text && !pendingFiles) || S.busy
3.  If S.session is null: await newSession(), await renderSessionList()
4.  Capture activeSid = S.session.session_id (before any awaits)
5.  uploadPendingFiles(): POST each file in S.pendingFiles to /api/upload
    - Shows upload progress bar
    - Clears S.pendingFiles on completion
    - Returns array of uploaded filenames
6.  Build msgText from text + file note
7.  Build userMsg {role:'user', content: displayText, attachments?: filenames}
8.  Push userMsg to S.messages, call renderMessages(), appendThinking()
9.  setBusy(true), setStatus('Hermes is thinking...')
10. INFLIGHT[activeSid] = {messages: [...S.messages], uploaded}
11. startApprovalPolling(activeSid)
12. POST /api/chat/start {session_id, message, model, workspace}
    Server: saves session, creates queue.Queue, starts daemon thread, returns {stream_id}
13. Browser opens EventSource('/api/chat/stream?stream_id=X')
14. In the SSE loop:
    - 'token': assistantText += d.text, ensureAssistantRow(), render markdown
    - 'tool': setStatus('tool name...')
    - 'approval': showApprovalCard(d)
    - 'done': sync S from d.session, renderMessages(), loadDir, renderSessionList,
               setBusy(false), delete INFLIGHT[activeSid]
    - 'error': show error message, setBusy(false)
    - es.onerror: handle network drops (show error, setBusy(false))
15. If approval needed: user clicks a button, respondApproval() fires
    POST /api/approval/respond -> server pops _pending, calls approve_*
    Agent retries the command (now is_approved() returns True) and continues

---
```

**File:** ARCHITECTURE.md (L822-863)
```markdown
## 11. How To Add a New API Endpoint

Follow this exact pattern. Review existing handlers in do_GET/do_POST for reference.

### Backend (server.py -> future: api/handlers.py)

GET endpoint:

    # Inside do_GET, before the 404 fallback line:
    if parsed.path == '/api/your/endpoint':
        qs = parse_qs(parsed.query)
        param = qs.get('param', [''])[0]
        if not param:
            return j(self, {'error': 'param is required'}, status=400)
        # do work
        return j(self, {'result': value})

POST endpoint (AFTER /api/upload check, body already parsed):

    if parsed.path == '/api/your/endpoint':
        value = body.get('field', '')
        if not value:
            return j(self, {'error': 'field is required'}, status=400)
        # do work
        return j(self, {'ok': True, 'data': result})

Endpoint requiring a valid session:

    sid = body.get('session_id', '')
    try:
        s = get_session(sid)
    except KeyError:
        return j(self, {'error': 'Session not found'}, status=404)

Endpoint that calls Hermes Python modules:

    # Example: calling cron.jobs
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from cron.jobs import list_jobs
    jobs = list_jobs(include_disabled=True)
    return j(self, {'jobs': jobs})
```

**File:** server.py (L1-6)
```python
"""
Hermes Web UI -- Main server entry point.
Thin routing shell: imports Handler, delegates to api/routes.py, runs server.
All business logic lives in api/*.
"""
import logging
```

**File:** server.py (L66-101)
```python
    def do_GET(self) -> None:
        self._req_t0 = time.time()
        # Per-request profile context from cookie (issue #798)
        cookie_profile = get_profile_cookie(self)
        if cookie_profile:
            set_request_profile(cookie_profile)
        try:
            parsed = urlparse(self.path)
            if not check_auth(self, parsed): return
            result = handle_get(self, parsed)
            if result is False:
                return j(self, {'error': 'not found'}, status=404)
        except Exception as e:
            print(f'[webui] ERROR {self.command} {self.path}\n' + traceback.format_exc(), flush=True)
            return j(self, {'error': 'Internal server error'}, status=500)
        finally:
            clear_request_profile()

    def do_POST(self) -> None:
        self._req_t0 = time.time()
        # Per-request profile context from cookie (issue #798)
        cookie_profile = get_profile_cookie(self)
        if cookie_profile:
            set_request_profile(cookie_profile)
        try:
            parsed = urlparse(self.path)
            if not check_auth(self, parsed): return
            result = handle_post(self, parsed)
            if result is False:
                return j(self, {'error': 'not found'}, status=404)
        except Exception as e:
            print(f'[webui] ERROR {self.command} {self.path}\n' + traceback.format_exc(), flush=True)
            return j(self, {'error': 'Internal server error'}, status=500)
        finally:
            clear_request_profile()

```

**File:** api/config.py (L1-52)
```python
"""
Hermes Web UI -- Shared configuration, constants, and global state.
Imported by all other api/* modules and by server.py.

Discovery order for all paths:
  1. Explicit environment variable
  2. Filesystem heuristics (sibling checkout, parent dir, common install locations)
  3. Hardened defaults relative to $HOME
  4. Fail loudly with a human-readable fix-it message if required modules are missing
"""

import collections
import copy
import json
import logging
import os
import sys
import threading
import time
import traceback
import uuid
from pathlib import Path
from urllib.parse import parse_qs, urlparse

# ── Basic layout ──────────────────────────────────────────────────────────────
HOME = Path.home()
# REPO_ROOT is the directory that contains this file's parent (api/ -> repo root)
REPO_ROOT = Path(__file__).parent.parent.resolve()

# ── Network config (env-overridable) ─────────────────────────────────────────
HOST = os.getenv("HERMES_WEBUI_HOST", "127.0.0.1")
PORT = int(os.getenv("HERMES_WEBUI_PORT", "8787"))

# ── TLS/HTTPS config (optional, env-overridable) ────────────────────────────
TLS_CERT = os.getenv("HERMES_WEBUI_TLS_CERT", "").strip() or None
TLS_KEY = os.getenv("HERMES_WEBUI_TLS_KEY", "").strip() or None
TLS_ENABLED = TLS_CERT is not None and TLS_KEY is not None

# ── State directory (env-overridable, never inside repo) ──────────────────────
STATE_DIR = (
    Path(os.getenv("HERMES_WEBUI_STATE_DIR", str(HOME / ".hermes" / "webui")))
    .expanduser()
    .resolve()
)

SESSION_DIR = STATE_DIR / "sessions"
WORKSPACES_FILE = STATE_DIR / "workspaces.json"
SESSION_INDEX_FILE = SESSION_DIR / "_index.json"
SETTINGS_FILE = STATE_DIR / "settings.json"
LAST_WORKSPACE_FILE = STATE_DIR / "last_workspace.txt"
PROJECTS_FILE = STATE_DIR / "projects.json"

```

**File:** api/routes.py (L472-476)
```python
def handle_get(handler, parsed) -> bool:
    """Handle all GET routes. Returns True if handled, False for 404."""

    if parsed.path in ("/", "/index.html"):
        return t(
```

**File:** api/routes.py (L879-892)
```python
def handle_post(handler, parsed) -> bool:
    """Handle all POST routes. Returns True if handled, False for 404."""
    # CSRF: reject cross-origin browser requests
    if not _check_csrf(handler):
        return j(handler, {"error": "Cross-origin request rejected"}, status=403)

    if parsed.path == "/api/upload":
        return handle_upload(handler)

    if parsed.path == "/api/transcribe":
        return handle_transcribe(handler)

    body = read_body(handler)

```

**File:** api/models.py (L23-79)
```python
def _write_session_index(updates=None):
    """Update the session index file.

    When *updates* is provided (a list of Session objects whose compact
    entries should be refreshed), this does a targeted in-place update of
    the existing index — O(1) for single-session changes.  When *updates*
    is None, a full rebuild is performed (used on startup / first call).
    """
    # Lazy full-rebuild path — used when index doesn't exist yet.
    if updates is None or not SESSION_INDEX_FILE.exists():
        entries = []
        for p in SESSION_DIR.glob('*.json'):
            if p.name.startswith('_'): continue
            try:
                s = Session.load(p.stem)
                if s: entries.append(s.compact())
            except Exception:
                logger.debug("Failed to load session from %s", p)
        with LOCK:
            for s in SESSIONS.values():
                if not any(e['session_id'] == s.session_id for e in entries):
                    entries.append(s.compact())
            entries.sort(key=lambda s: s['updated_at'], reverse=True)
            _tmp = SESSION_INDEX_FILE.with_suffix('.tmp')
            _tmp.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding='utf-8')
            os.replace(_tmp, SESSION_INDEX_FILE)
        return

    # Fast path: patch existing index with updated sessions.
    # This avoids loading every session file on every single save().
    # LOCK covers the entire read-patch-write to prevent concurrent save() calls
    # from both reading the same baseline and one losing its update.
    _fallback = False
    try:
        with LOCK:
            existing = json.loads(SESSION_INDEX_FILE.read_text(encoding='utf-8'))
            # Build lookup of updated entries
            updated_map = {s.session_id: s.compact() for s in updates}
            existing_ids = {e.get('session_id') for e in existing}
            # Add any updated entries not yet in the index
            for sid, entry in updated_map.items():
                if sid not in existing_ids:
                    existing.append(entry)
            # Replace matching entries in-place
            for i, e in enumerate(existing):
                sid = e.get('session_id')
                if sid in updated_map:
                    existing[i] = updated_map[sid]
            existing.sort(key=lambda s: s.get('updated_at', 0), reverse=True)
            _tmp = SESSION_INDEX_FILE.with_suffix('.tmp')
            _tmp.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding='utf-8')
            os.replace(_tmp, SESSION_INDEX_FILE)
    except Exception:
        _fallback = True
    if _fallback:
        # Corrupt or missing index — fall back to full rebuild (called outside LOCK to avoid deadlock)
        _write_session_index(updates=None)
```

**File:** api/models.py (L82-132)
```python
class Session:
    def __init__(self, session_id: str=None, title: str='Untitled',
                 workspace=str(DEFAULT_WORKSPACE), model=DEFAULT_MODEL,
                 messages=None, created_at=None, updated_at=None,
                 tool_calls=None, pinned: bool=False, archived: bool=False,
                 project_id: str=None, profile=None,
                 input_tokens: int=0, output_tokens: int=0, estimated_cost=None,
                 personality=None,
                 active_stream_id: str=None,
                 pending_user_message: str=None,
                 pending_attachments=None,
                 pending_started_at=None,
                 compression_anchor_visible_idx=None,
                 compression_anchor_message_key=None,
                 **kwargs):
        self.session_id = session_id or uuid.uuid4().hex[:12]
        self.title = title
        self.workspace = str(Path(workspace).expanduser().resolve())
        self.model = model
        self.messages = messages or []
        self.tool_calls = tool_calls or []
        self.created_at = created_at or time.time()
        self.updated_at = updated_at or time.time()
        self.pinned = bool(pinned)
        self.archived = bool(archived)
        self.project_id = project_id or None
        self.profile = profile
        self.input_tokens = input_tokens or 0
        self.output_tokens = output_tokens or 0
        self.estimated_cost = estimated_cost
        self.personality = personality
        self.active_stream_id = active_stream_id
        self.pending_user_message = pending_user_message
        self.pending_attachments = pending_attachments or []
        self.pending_started_at = pending_started_at
        self.compression_anchor_visible_idx = compression_anchor_visible_idx
        self.compression_anchor_message_key = compression_anchor_message_key

    @property
    def path(self):
        return SESSION_DIR / f'{self.session_id}.json'

    def save(self, touch_updated_at: bool = True, skip_index: bool = False) -> None:
        if touch_updated_at:
            self.updated_at = time.time()
        self.path.write_text(
            json.dumps(self.__dict__, ensure_ascii=False, indent=2),
            encoding='utf-8',
        )
        if not skip_index:
            _write_session_index(updates=[self])
```

**File:** api/models.py (L134-142)
```python
    @classmethod
    def load(cls, sid):
        # Validate session ID format to prevent path traversal
        if not sid or not all(c in '0123456789abcdefghijklmnopqrstuvwxyz_' for c in sid):
            return None
        p = SESSION_DIR / f'{sid}.json'
        if not p.exists():
            return None
        return cls(**json.loads(p.read_text(encoding='utf-8')))
```

**File:** api/streaming.py (L29-31)
```python
# interleave their os.environ writes. This global lock serializes the env
# save/restore around the entire agent run.
_ENV_LOCK = threading.Lock()
```

**File:** api/streaming.py (L789-840)
```python
def _run_agent_streaming(session_id, msg_text, model, workspace, stream_id, attachments=None):
    """Run agent in background thread, writing SSE events to STREAMS[stream_id]."""
    q = STREAMS.get(stream_id)
    if q is None:
        return
    s = None
    _rt = {}
    old_cwd = None
    old_exec_ask = None
    old_session_key = None
    old_hermes_home = None

    # ── MCP Server Discovery (lazy import, idempotent) ──
    # discover_mcp_tools() is called here (rather than at server startup) so that
    # the hermes-agent package is fully initialized before we try to connect.
    # It is safe to call multiple times — already-connected servers are skipped.
    try:
        from tools.mcp_tool import discover_mcp_tools
        discover_mcp_tools()
    except Exception:
        pass  # MCP not available or not configured — non-fatal

    # Sprint 10: create a cancel event for this stream
    cancel_event = threading.Event()
    with STREAMS_LOCK:
        CANCEL_FLAGS[stream_id] = cancel_event

    def put(event, data):
        # If cancelled, drop all further events except the cancel event itself
        if cancel_event.is_set() and event not in ('cancel', 'error'):
            return
        try:
            q.put_nowait((event, data))
        except Exception:
            logger.debug("Failed to put event to queue")

    # Initialised here (before any code that may raise) so the outer `finally`
    # block can safely check `if _checkpoint_stop is not None` even when an
    # exception fires before the checkpoint thread is created (Issue #765).
    _checkpoint_stop = None
    try:
        s = get_session(session_id)
        s.workspace = str(Path(workspace).expanduser().resolve())
        s.model = model

        _agent_lock = _get_session_agent_lock(session_id)
        # TD1: set thread-local env context so concurrent sessions don't clobber globals
        # Check for pre-flight cancel (user cancelled before agent even started)
        if cancel_event.is_set():
            put('cancel', {'message': 'Cancelled before start'})
            return

```

**File:** api/profiles.py (L29-38)
```python
# ── Module state ────────────────────────────────────────────────────────────
_active_profile = 'default'
_profile_lock = threading.Lock()
_loaded_profile_env_keys: set[str] = set()

# Thread-local profile context: set per-request by server.py, cleared after.
# Enables per-client profile isolation (issue #798) — each HTTP request thread
# reads its own profile from the hermes_profile cookie instead of the
# process-global _active_profile.
_tls = threading.local()
```

**File:** api/helpers.py (L31-35)
```python
def safe_resolve(root: Path, requested: str) -> Path:
    """Resolve a relative path inside root, raising ValueError on traversal."""
    resolved = (root / requested).resolve()
    resolved.relative_to(root.resolve())  # raises ValueError if outside root
    return resolved
```

**File:** api/helpers.py (L57-74)
```python
def j(handler, payload, status: int=200, extra_headers: dict=None) -> None:
    """Send a JSON response.

    *extra_headers*: optional dict of additional headers to include
    (e.g., {'Set-Cookie': '...'}).  Headers are sent before end_headers().
    """
    body = _json.dumps(payload, ensure_ascii=False, indent=2).encode('utf-8')
    handler.send_response(status)
    handler.send_header('Content-Type', 'application/json; charset=utf-8')
    handler.send_header('Content-Length', str(len(body)))
    handler.send_header('Cache-Control', 'no-store')
    _security_headers(handler)
    if extra_headers:
        for k, v in extra_headers.items():
            handler.send_header(k, v)
    handler.end_headers()
    handler.wfile.write(body)

```

**File:** static/ui.js (L1-3)
```javascript
const S={session:null,messages:[],entries:[],busy:false,pendingFiles:[],toolCalls:[],activeStreamId:null,currentDir:'.',activeProfile:'default'};
const INFLIGHT={};  // keyed by session_id while request in-flight
const SESSION_QUEUES={};  // keyed by session_id for queued follow-up turns
```

**File:** static/boot.js (L17-53)
```javascript
// ── Mobile navigation ──────────────────────────────────────────────────────
let _workspacePanelMode='closed'; // 'closed' | 'browse' | 'preview'

function _isCompactWorkspaceViewport(){
  return window.matchMedia('(max-width: 900px)').matches;
}

function _workspacePanelEls(){
  return {
    layout: document.querySelector('.layout'),
    panel: document.querySelector('.rightpanel'),
    toggleBtn: $('btnWorkspacePanelToggle'),
    collapseBtn: $('btnCollapseWorkspacePanel'),
  };
}

function _hasWorkspacePreviewVisible(){
  const preview=$('previewArea');
  return !!(preview&&preview.classList.contains('visible'));
}

function _setWorkspacePanelMode(mode){
  const {layout,panel}= _workspacePanelEls();
  if(!layout||!panel)return;
  _workspacePanelMode=(mode==='browse'||mode==='preview')?mode:'closed';
  const open=_workspacePanelMode!=='closed';
  document.documentElement.dataset.workspacePanel=open?'open':'closed';
  // Persist open/closed across refreshes (browse/preview → open; closed → closed)
  localStorage.setItem('hermes-webui-workspace-panel', open ? 'open' : 'closed');
  layout.classList.toggle('workspace-panel-collapsed',!open);
  if(_isCompactWorkspaceViewport()){
    panel.classList.toggle('mobile-open',open);
  }else{
    panel.classList.remove('mobile-open');
  }
  syncWorkspacePanelUI();
}
```
