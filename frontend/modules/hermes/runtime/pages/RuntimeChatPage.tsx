"use client";

import { useEffect, useMemo, useState } from "react";
import { HermesModuleShell } from "@/modules/hermes/components/layout/HermesModuleShell";
import { RuntimeChatHeader } from "../components/RuntimeChatHeader";
import { RuntimeMessageList } from "../components/RuntimeMessageList";
import { RuntimeApprovalCard } from "../components/RuntimeApprovalCard";
import { RuntimeClarifyCard } from "../components/RuntimeClarifyCard";
import { RuntimeComposer } from "../components/RuntimeComposer";
import { RuntimeWorkspacePanel } from "../components/RuntimeWorkspacePanel";
import { Button } from "@/components/ui/button";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { useRuntimeSse } from "../hooks/use-runtime-sse";
import { useRuntimeApprovalPolling } from "../hooks/use-runtime-approval";
import { useRuntimeClarifyPolling } from "../hooks/use-runtime-clarify";
import { useRuntimeSessionStore } from "../stores/runtime-session-store";
import { useRuntimeStreamStore } from "../stores/runtime-stream-store";

export default function RuntimeChatPage() {
  const [showRightPanel, setShowRightPanel] = useState(true);
  const currentSession = useRuntimeSessionStore((s) => s.currentSession);
  const messages = useRuntimeSessionStore((s) => s.messages);
  const busy = useRuntimeSessionStore((s) => s.busy);
  const loadSession = useRuntimeSessionStore((s) => s.loadSession);
  const createSession = useRuntimeSessionStore((s) => s.createSession);
  const bootstrapRuntimeConversation = useRuntimeSessionStore(
    (s) => s.bootstrapRuntimeConversation
  );
  const toolCalls = useRuntimeStreamStore((s) => s.toolCalls);

  const { send, cancel } = useRuntimeSse();

  useRuntimeApprovalPolling(currentSession?.session_id ?? "", busy);
  useRuntimeClarifyPolling(currentSession?.session_id ?? "", busy);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await bootstrapRuntimeConversation();
      } catch {
        /* 后端未就绪时仅保持空状态 */
      }
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [bootstrapRuntimeConversation]);

  const activeSessionId = currentSession?.session_id ?? null;

  const title = useMemo(() => {
    if (!currentSession) return "Hermes Runtime";
    return currentSession.title || "Hermes Runtime";
  }, [currentSession]);

  return (
    <HermesModuleShell
      title=""
      description=""
    >
      <div className="flex flex-col xl:flex-row" style={{ height: "calc(100vh - 110px)", marginTop: "0px;", marginBottom: "0px;"  }}>
        {/* main */}
        <div className="h-[720px] w-full xl:flex-1">
          <div className="relative flex h-full flex-col rounded-xl border bg-background overflow-hidden">
            <RuntimeChatHeader
              title={title}
              sessionId={activeSessionId}
              model={currentSession?.model ?? null}
              isLoading={busy}
              actions={
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowRightPanel((v) => !v)}
                  aria-label={showRightPanel ? "隐藏 Workspace" : "显示 Workspace"}
                  title={showRightPanel ? "隐藏 Workspace" : "显示 Workspace"}
                >
                  {showRightPanel ? (
                    <PanelRightClose className="h-4 w-4" />
                  ) : (
                    <PanelRightOpen className="h-4 w-4" />
                  )}
                </Button>
              }
            />

            <div className="flex-1 min-h-0">
              <RuntimeMessageList
                messages={messages}
                toolCalls={toolCalls}
                isStreaming={busy}
              />
            </div>

            {/* floating composer (25px above bottom) */}
            <div className="pointer-events-none static left-0 right-0" style={{ marginBottom: "15px" }}>
              <div className="pointer-events-auto mx-auto px-3" style={{ maxWidth: "900px" }}>
                <RuntimeApprovalCard />
                <RuntimeClarifyCard />
                <div className="rounded-xl border bg-background/95 p-3 shadow-sm backdrop-blur">
                  <RuntimeComposer
                    isLoading={busy}
                    onSend={async (payload) => {
                      if (!currentSession) {
                        const s = await createSession();
                        await loadSession(s.session_id);
                      }
                      await send({ text: payload.text, files: payload.files });
                    }}
                    onCancel={() => cancel()}
                    onModelChange={(model) => {
                      const session = useRuntimeSessionStore.getState().currentSession;
                      if (session) {
                        useRuntimeSessionStore.getState().setCurrentSession({
                          ...session,
                          model,
                        });
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* spacer so message list not covered by floating composer */}
            <div className="h-[190px]" />
          </div>
        </div>

        {/* rightPanel */}
        {showRightPanel ? (
          <div className="h-[720px] xl:w-[380px] xl:max-w-[380px] xl:shrink-0">
            <RuntimeWorkspacePanel />
          </div>
        ) : null}
      </div>
    </HermesModuleShell>
  );
}

