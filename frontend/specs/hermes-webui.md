以下是对该项目的完整架构分析，分为两大核心主题。

---

## 一、与 Hermes Agent 对接的核心逻辑

### 1. 调用链总览

```
messages.js::send()
  → POST /api/chat/start          (获取 stream_id)
  → GET  /api/chat/stream?stream_id=X  (SSE 长连接)
      ↕ 后端
  api/routes.py::handle_post()
  → api/streaming.py::_run_agent_streaming()  (daemon 线程)
  → run_agent.AIAgent.run_conversation()      (Hermes 核心)
```

### 2. 两阶段启动设计（POST + SSE）

前端发送消息时，**不是**一次性 POST 等待结果，而是分两步：

**Step 1** — `POST /api/chat/start`：服务端创建一个 `queue.Queue`，注册到 `STREAMS[stream_id]`，启动 daemon 线程运行 agent，立即返回 `{stream_id}`。 [1](#0-0) 

**Step 2** — `GET /api/chat/stream?stream_id=X`：浏览器用 `EventSource` 打开 SSE 长连接，服务端从队列中读取事件并转发，直到收到 `done` 或 `error`。 [2](#0-1) 

这样设计的好处：`POST` 立即返回，不会超时；SSE 连接断开后可以重连（通过 `/api/chat/stream/status` 检查流是否仍活跃）。 [3](#0-2) 

### 3. `_run_agent_streaming` — Agent 调用核心

位于 `api/streaming.py`，在 daemon 线程中运行：

**环境变量注入**（Agent 通过 env var 感知上下文）：
```python
_set_thread_env(
    TERMINAL_CWD=str(s.workspace),
    HERMES_EXEC_ASK='1',
    HERMES_SESSION_KEY=session_id,
    HERMES_HOME=_profile_home,
)
``` [4](#0-3) 

**AIAgent 构造**（关键参数）：
- `stream_delta_callback=on_token`：每个 token 触发，写入队列 `put('token', {'text': text})`
- `tool_progress_callback=on_tool`：每次工具调用触发，写入 `put('tool', {...})`，并立即检查是否有待审批项 [5](#0-4) 

**Workspace 上下文注入**：每条消息前缀 `[Workspace: /path]`，并附带 system message 告知 agent 以此为工作目录，覆盖任何历史记忆中的路径： [6](#0-5) 

**消息净化**（`_sanitize_messages_for_api`）：WebUI 在消息上附加了 `attachments`、`_ts` 等展示字段，发给 LLM 前必须剥离，否则部分 provider（如 Z.AI/GLM）会返回 HTTP 400： [7](#0-6) 

### 4. SSE 事件类型

| 事件 | 数据 | 前端处理 |
|---|---|---|
| `token` | `{text}` | 追加到 `assistantText`，rAF 节流渲染 |
| `tool` | `{name, preview, args}` | 显示 live tool card，更新状态栏 |
| `approval` | `{command, description, pattern_keys}` | 弹出审批卡片 |
| `done` | `{session, usage}` | 同步 `S.session`，重渲染，关闭流 |
| `apperror` | `{message, type}` | 显示错误（区分 rate_limit 和普通错误） |
| `cancel` | `{message}` | 清理状态，显示"Task cancelled" | [8](#0-7) 

### 5. Human-in-the-Loop 审批系统

审批状态存在 `tools/approval.py` 的模块级变量 `_pending` dict 中，与 HTTP 线程和 agent daemon 线程共享（同进程，Python import 缓存保证同一对象）。

流程：
1. Agent 调用危险工具 → `tools/approval.py` 写入 `_pending[session_id]`
2. `on_tool` 回调检测到 `has_pending(session_id)` → 立即 `put('approval', p)` 进队列
3. 前端收到 `approval` 事件 → `showApprovalCard()`，同时 1500ms 轮询 `/api/approval/pending` 作为兜底
4. 用户点击 → `POST /api/approval/respond` → `approve_session()` / `approve_permanent()` → agent 重试工具调用 [9](#0-8) [10](#0-9) 

### 6. CLI Bridge（SQLite 读取）

`get_cli_sessions()` 直接读取 Hermes CLI 的 `~/.hermes/state.db`，将终端会话以 `is_cli_session: true` 标记展示在侧边栏，实现 Web UI 与 CLI 的会话统一视图： [11](#0-10) 

---

## 二、页面实现的构建思路

### 1. 无框架哲学

**无构建步骤、无打包器、无前端框架**。6 个 vanilla JS 文件按依赖顺序用 `<script>` 标签加载，共享全局作用域。外部依赖仅 Prism.js（语法高亮）和 Mermaid.js（图表），均从 CDN 异步加载。 [12](#0-11) 

### 2. 三栏布局

```
<aside class="sidebar">    左：会话列表、导航 Tab、模型选择器
<main class="main">        中：顶栏、消息区、审批卡片、输入框
<aside class="rightpanel"> 右：工作区文件树 + 文件预览
``` [13](#0-12) 

### 3. 全局状态 `S`

所有模块共享一个顶层对象 `S`，定义在 `ui.js` 第一行：

```js
const S = {
  session: null,      // 当前会话 compact dict
  messages: [],       // 当前会话完整消息列表
  busy: false,        // agent 运行中（禁用发送按钮）
  pendingFiles: [],   // 待上传文件队列
  toolCalls: [],      // 当前轮次工具调用记录
  activeStreamId: null,
  activeProfile: 'default'
}
``` [14](#0-13) 

`INFLIGHT` 字典记录飞行中请求的消息快照，用于用户切换会话后切回时恢复进行中状态： [15](#0-14) 

### 4. 六模块职责划分

| 模块 | 职责 |
|---|---|
| `ui.js` | DOM 工具函数、`renderMd()`、工具卡片渲染、模型下拉、滚动锁定 |
| `workspace.js` | 文件树加载、文件预览（图片/Markdown/代码）、文件操作 |
| `sessions.js` | 会话 CRUD、侧边栏渲染、搜索、项目分组、SVG 图标 |
| `messages.js` | `send()`、SSE 事件处理、审批卡片、消息队列 |
| `panels.js` | Cron/Skills/Memory/Profiles/Todo 面板切换与数据加载 |
| `boot.js` | 事件绑定、移动端导航、语音输入、启动 IIFE | [16](#0-15) 

### 5. 启动流程（boot.js IIFE）

```
1. GET /api/settings → 恢复发送键偏好、token 显示设置
2. GET /api/profile/active → 恢复活跃 profile
3. GET /api/models → 动态填充模型下拉（含 provider 分组）
4. localStorage 恢复上次模型选择
5. loadWorkspaceList() → 预加载工作区列表
6. _initResizePanels() → 恢复面板宽度（localStorage）
7. localStorage['hermes-webui-session'] → 恢复上次会话
   ├─ 成功 → loadSession() + checkInflightOnBoot()（检查是否有未完成流）
   └─ 失败 → 显示 emptyState，等待用户点击 +
``` [17](#0-16) 

**关键设计**：启动时**绝不自动创建会话**，只在用户首次发送消息时才创建（`send()` 中的 `if(!S.session) await newSession()`）。 [18](#0-17) 

### 6. 渲染管线

**rAF 节流**：token 流入时不是每个 token 都触发 DOM 更新，而是用 `requestAnimationFrame` 批量渲染，避免高频重绘： [19](#0-18) 

**自制 Markdown 渲染器**（`renderMd`）：一个 15 步正则链，先 stash 代码块，再依次处理 mermaid、代码、粗体、斜体、标题、列表、表格，最后用 `SAFE_TAGS` 白名单过滤 HTML，防止 XSS： [20](#0-19) 

### 7. 后端架构

`server.py` 是 ~83 行的薄壳，仅负责 `ThreadingHTTPServer` 启动、结构化 JSON 日志、auth 中间件，所有路由委托给 `api/routes.py`： [21](#0-20) 

会话持久化用 JSON 文件（`~/.hermes/webui-mvp/sessions/{id}.json`），并维护 `_index.json` 实现 O(1) 会话列表读取；内存中用 `OrderedDict` + LRU cap 100 缓存热会话： [22](#0-21)

### Citations

**File:** ARCHITECTURE.md (L19-22)
```markdown
The design philosophy is deliberately minimal. There is no build step, no bundler, no
frontend framework. The Python server is split into a routing shell (server.py) and
business logic modules (api/). The frontend is seven vanilla JS modules loaded from static/.
This makes the code easy to modify from a terminal or by an agent.
```

**File:** ARCHITECTURE.md (L200-207)
```markdown
    POST /api/chat/start     Receives the user message. Creates a queue.Queue, stores it
                             in STREAMS[stream_id], spawns a daemon thread running
                             _run_agent_streaming(), returns {stream_id} immediately.

    GET  /api/chat/stream    Long-lived SSE connection. Reads from STREAMS[stream_id]
                             and forwards events to the browser until 'done' or 'error'.

Queue registry:
```

**File:** ARCHITECTURE.md (L213-228)
```markdown

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

```

**File:** ARCHITECTURE.md (L347-355)
```markdown
Six JS modules loaded in order at end of <body>:
  1. ui.js       (~846 lines) DOM helpers, renderMd, tool card rendering, global state
  2. workspace.js (~169 lines) File tree, preview, file operations
  3. sessions.js  (~532 lines) Session CRUD, list rendering, search, SVG icons, overlay actions, project picker
  4. messages.js  (~293 lines) send(), SSE event handlers, approval, transcript
  5. panels.js    (~771 lines) Cron, skills, memory, workspace, todo, switchPanel
  6. boot.js      (~175 lines) Event wiring + boot IIFE

sessions.js defines an `ICONS` constant at module level with hardcoded SVG strings for all
```

**File:** ARCHITECTURE.md (L359-363)
```markdown
Three-panel layout (in static/index.html):

    <aside class="sidebar">    Left panel: session list, nav tabs, model selector
    <main class="main">        Center: topbar, messages area, approval card, composer
    <aside class="rightpanel"> Right panel: workspace file tree and file preview
```

**File:** ARCHITECTURE.md (L375-381)
```markdown
    const INFLIGHT = {}
    // keyed by session_id while a request is in-flight for that session
    // value: {messages: [...snapshot...], uploaded: [...filenames...]}
    // Purpose: if user switches sessions while a request is pending,
    //   switching back shows the in-progress state instead of the saved state

### 5.3 Key Functions Reference
```

**File:** ARCHITECTURE.md (L423-424)
```markdown
    On load: try to loadSession(saved), fall back to empty state if missing or fails
    NEVER auto-creates a session on boot
```

**File:** ARCHITECTURE.md (L427-464)
```markdown

A hand-rolled regex chain with HTML safety. Processes in this order:

Pre-pass (v0.18.1):
0a. Stash fenced code blocks and backtick spans (fence_stash array)
0b. Convert safe HTML tags to markdown equivalents:
    <strong>/<b> -> **text**, <em>/<i> -> *text*, <code> -> `text`, <br> -> newline
0c. Restore stashed code blocks

Pipeline:
1. Mermaid blocks (```mermaid ... ```) -> <div class="mermaid-block">
2. Code blocks (``` lang ... ```) -> <pre><code> with language header
3. Inline code (`...`) -> <code>
4. Bold+italic (***..***) -> <strong><em>
5. Bold (**...**) -> <strong>
6. Italic (*...*) -> <em>
7. Headings (# ## ###) -> <h1> <h2> <h3> (uses inlineMd() for content)
8. Horizontal rules (---+) -> <hr>
9. Blockquotes (> ...) -> <blockquote> (uses inlineMd() for content)
10. Unordered lists (- or * or + at line start) -> <ul><li> (uses inlineMd())
11. Ordered lists (N. at line start) -> <ol><li> (uses inlineMd())
12. Links ([text](https://...)) -> <a href target=_blank>
13. Tables (| col | col |) -> <table>
14. Safety net: escape any HTML tag not in SAFE_TAGS allowlist via esc()
15. Paragraph wrapping: remaining double-newline-separated blocks -> <p>

inlineMd() helper (v0.18.1):
    Processes inline bold/italic/code/links within list items, blockquotes,
    and headings. Escapes unknown tags via SAFE_INLINE allowlist. Replaces
    the old direct esc() calls which would double-escape pre-pass output.

SAFE_TAGS allowlist:
    strong, em, code, pre, h1-6, ul, ol, li, table, thead, tbody, tr, th,
    td, hr, blockquote, p, br, a, div. Everything else is escaped.

Known gaps:
- Nested lists: single regex pass, multi-level indentation not handled
- Mixed bold+link in same line: may produce garbled output
```

**File:** static/messages.js (L60-82)
```javascript
  let streamId;
  try{
    const startData=await api('/api/chat/start',{method:'POST',body:JSON.stringify({
      session_id:activeSid,message:msgText,
      model:S.session.model||$('modelSelect').value,workspace:S.session.workspace,
      attachments:uploaded.length?uploaded:undefined
    })});
    streamId=startData.stream_id;
    S.activeStreamId = streamId;
    markInflight(activeSid, streamId);
    // Show Cancel button
    const cancelBtn=$('btnCancel');
    if(cancelBtn) cancelBtn.style.display='';
  }catch(e){
    delete INFLIGHT[activeSid];
    stopApprovalPolling();
    // Only hide approval card if it belongs to the session that just finished
    if(!_approvalSessionId || _approvalSessionId===activeSid) hideApprovalCard();removeThinking();
    S.messages.push({role:'assistant',content:`**Error:** ${e.message}`});
    renderMessages();setBusy(false);setStatus('Error: '+e.message);
    return;
  }

```

**File:** static/messages.js (L107-116)
```javascript
  let _renderPending=false;
  function _scheduleRender(){
    if(_renderPending) return;
    _renderPending=true;
    requestAnimationFrame(()=>{
      _renderPending=false;
      if(assistantBody) assistantBody.innerHTML=renderMd(assistantText);
      scrollIfPinned();
    });
  }
```

**File:** static/messages.js (L220-238)
```javascript
    source.addEventListener('error',e=>{
      source.close();
      // Attempt one reconnect if the stream is still active server-side
      if(!_reconnectAttempted && streamId){
        _reconnectAttempted=true;
        setStatus('Connection lost \u2014 reconnecting\u2026');
        setTimeout(async()=>{
          try{
            const st=await api(`/api/chat/stream/status?stream_id=${encodeURIComponent(streamId)}`);
            if(st.active){
              setStatus('Reconnected');
              _wireSSE(new EventSource(new URL(`/api/chat/stream?stream_id=${encodeURIComponent(streamId)}`,location.origin).href,{withCredentials:true}));
              return;
            }
          }catch(_){}
          _handleStreamError();
        },1500);
        return;
      }
```

**File:** static/messages.js (L334-346)
```javascript
function startApprovalPolling(sid) {
  stopApprovalPolling();
  _approvalPollTimer = setInterval(async () => {
    if (!S.busy || !S.session || S.session.session_id !== sid) {
      stopApprovalPolling(); hideApprovalCard(); return;
    }
    try {
      const data = await api("/api/approval/pending?session_id=" + encodeURIComponent(sid));
      if (data.pending) { data.pending._session_id=sid; showApprovalCard(data.pending); }
      else { hideApprovalCard(); }
    } catch(e) { /* ignore poll errors */ }
  }, 1500);
}
```

**File:** api/streaming.py (L33-47)
```python
def _sanitize_messages_for_api(messages):
    """Return a deep copy of messages with only API-safe fields.

    The webui stores extra metadata on messages (attachments, timestamp, _ts)
    for display purposes. Some providers (e.g. Z.AI/GLM) reject unknown fields
    instead of ignoring them, causing HTTP 400 errors on subsequent messages.
    """
    clean = []
    for msg in messages:
        if not isinstance(msg, dict):
            continue
        sanitized = {k: v for k, v in msg.items() if k in _API_SAFE_MSG_KEYS}
        if sanitized.get('role'):
            clean.append(sanitized)
    return clean
```

**File:** api/streaming.py (L96-101)
```python
        _set_thread_env(
            TERMINAL_CWD=str(s.workspace),
            HERMES_EXEC_ASK='1',
            HERMES_SESSION_KEY=session_id,
            HERMES_HOME=_profile_home,
        )
```

**File:** api/streaming.py (L126-132)
```python
                # also check for pending approval and surface it immediately
                from tools.approval import has_pending as _has_pending, _pending, _lock
                if _has_pending(session_id):
                    with _lock:
                        p = dict(_pending.get(session_id, {}))
                    if p:
                        put('approval', p)
```

**File:** api/streaming.py (L174-186)
```python
            agent = AIAgent(
                model=resolved_model,
                provider=resolved_provider,
                base_url=resolved_base_url,
                api_key=resolved_api_key,
                platform='cli',
                quiet_mode=True,
                enabled_toolsets=_toolsets,
                fallback_model=_fallback_resolved,
                session_id=session_id,
                stream_delta_callback=on_token,
                tool_progress_callback=on_tool,
            )
```

**File:** api/streaming.py (L188-207)
```python
            # to use for file operations, regardless of session age or AGENTS.md defaults.
            workspace_ctx = f"[Workspace: {s.workspace}]\n"
            workspace_system_msg = (
                f"Active workspace at session start: {s.workspace}\n"
                "Every user message is prefixed with [Workspace: /absolute/path] indicating the "
                "workspace the user has selected in the web UI at the time they sent that message. "
                "This tag is the single authoritative source of the active workspace and updates "
                "with every message. It overrides any prior workspace mentioned in this system "
                "prompt, memory, or conversation history. Always use the value from the most recent "
                "[Workspace: ...] tag as your default working directory for ALL file operations: "
                "write_file, read_file, search_files, terminal workdir, and patch. "
                "Never fall back to a hardcoded path when this tag is present."
            )
            result = agent.run_conversation(
                user_message=workspace_ctx + msg_text,
                system_message=workspace_system_msg,
                conversation_history=_sanitize_messages_for_api(s.messages),
                task_id=session_id,
                persist_user_message=msg_text,
            )
```

**File:** api/models.py (L97-110)
```python
def get_session(sid):
    with LOCK:
        if sid in SESSIONS:
            SESSIONS.move_to_end(sid)  # LRU: mark as recently used
            return SESSIONS[sid]
    s = Session.load(sid)
    if s:
        with LOCK:
            SESSIONS[sid] = s
            SESSIONS.move_to_end(sid)
            while len(SESSIONS) > SESSIONS_MAX:
                SESSIONS.popitem(last=False)  # evict least recently used
        return s
    raise KeyError(sid)
```

**File:** api/models.py (L257-292)
```python
        with sqlite3.connect(str(db_path)) as conn:
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("""
                SELECT s.id, s.title, s.model, s.message_count,
                       s.started_at, s.source,
                       MAX(m.timestamp) AS last_activity
                FROM sessions s
                LEFT JOIN messages m ON m.session_id = s.id
                GROUP BY s.id
                ORDER BY COALESCE(MAX(m.timestamp), s.started_at) DESC
                LIMIT 200
            """)
            for row in cur.fetchall():
                sid = row['id']
                raw_ts = row['last_activity'] or row['started_at']
                # Prefer the CLI session's own profile from the DB; fall back to
                # the active CLI profile so sidebar filtering works either way.
                profile = _cli_profile  # CLI DB has no profile column; use active profile

                cli_sessions.append({
                    'session_id': sid,
                    'title': row['title'] or 'CLI Session',
                    'workspace': str(get_last_workspace()),
                    'model': row['model'] or 'unknown',
                    'message_count': row['message_count'] or 0,
                    'created_at': row['started_at'],
                    'updated_at': raw_ts,
                    'pinned': False,
                    'archived': False,
                    'project_id': None,
                    'profile': profile,
                    'source_tag': 'cli',
                    'is_cli_session': True,
                })
    except Exception:
```

**File:** static/ui.js (L1-3)
```javascript
const S={session:null,messages:[],entries:[],busy:false,pendingFiles:[],toolCalls:[],activeStreamId:null,currentDir:'.',activeProfile:'default'};
const INFLIGHT={};  // keyed by session_id while request in-flight
const MSG_QUEUE=[];  // messages queued while a request is in-flight
```

**File:** static/boot.js (L309-337)
```javascript
(async()=>{
  // Load send key preference
  try{const s=await api('/api/settings');window._sendKey=s.send_key||'enter';window._showTokenUsage=!!s.show_token_usage;window._showCliSessions=!!s.show_cli_sessions;}catch(e){window._sendKey='enter';window._showTokenUsage=false;window._showCliSessions=false;}
  // Fetch active profile
  try{const p=await api('/api/profile/active');S.activeProfile=p.name||'default';}catch(e){S.activeProfile='default';}
  // Update profile chip label immediately
  const profileLabel=$('profileChipLabel');
  if(profileLabel) profileLabel.textContent=S.activeProfile||'default';
  // Fetch available models from server and populate dropdown dynamically
  await populateModelDropdown();
  // Restore last-used model preference
  const savedModel=localStorage.getItem('hermes-webui-model');
  if(savedModel && $('modelSelect')){
    $('modelSelect').value=savedModel;
    // If the value didn't take (model not in list), clear the bad pref
    if($('modelSelect').value!==savedModel) localStorage.removeItem('hermes-webui-model');
  }
  // Pre-load workspace list so sidebar name is correct from first render
  await loadWorkspaceList();
  _initResizePanels();
  const saved=localStorage.getItem('hermes-webui-session');
  if(saved){
    try{await loadSession(saved);await renderSessionList();await checkInflightOnBoot(saved);return;}
    catch(e){localStorage.removeItem('hermes-webui-session');}
  }
  // no saved session - show empty state, wait for user to hit +
  $('emptyState').style.display='';
  await renderSessionList();
})();
```

**File:** server.py (L17-56)
```python
class Handler(BaseHTTPRequestHandler):
    server_version = 'HermesWebUI/0.2'
    def log_message(self, fmt, *args): pass  # suppress default Apache-style log

    def log_request(self, code='-', size='-'):
        """Structured JSON logs for each request."""
        import json as _json
        duration_ms = round((time.time() - getattr(self, '_req_t0', time.time())) * 1000, 1)
        record = _json.dumps({
            'ts': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'method': self.command or '-',
            'path': self.path or '-',
            'status': int(code) if str(code).isdigit() else code,
            'ms': duration_ms,
        })
        print(f'[webui] {record}', flush=True)

    def do_GET(self):
        self._req_t0 = time.time()
        try:
            parsed = urlparse(self.path)
            if not check_auth(self, parsed): return
            result = handle_get(self, parsed)
            if result is False:
                return j(self, {'error': 'not found'}, status=404)
        except Exception as e:
            print(f'[webui] ERROR {self.command} {self.path}\n' + traceback.format_exc(), flush=True)
            return j(self, {'error': 'Internal server error'}, status=500)

    def do_POST(self):
        self._req_t0 = time.time()
        try:
            parsed = urlparse(self.path)
            if not check_auth(self, parsed): return
            result = handle_post(self, parsed)
            if result is False:
                return j(self, {'error': 'not found'}, status=404)
        except Exception as e:
            print(f'[webui] ERROR {self.command} {self.path}\n' + traceback.format_exc(), flush=True)
            return j(self, {'error': 'Internal server error'}, status=500)
```
