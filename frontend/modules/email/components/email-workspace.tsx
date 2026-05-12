"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "react-hot-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import type {
  EmailAccountResponse,
  EmailFolderResponse,
  EmailListParams,
  EmailMessageResponse,
} from "@portal/shared";

import { useEmailSync } from "../hooks/use-email-sync";
import { useEmailAccountStore } from "../stores/email-account-store";
import { useEmailStore } from "../stores/email-store";
import type { EmailContactView } from "../types/email-view";
import {
  fetchEmailAccount,
  getEmailDemoContacts,
  getEmailMessage,
  listEmailFolders,
  listEmailMessages,
} from "../services/email-api";
import { EmailAccountForm } from "./email-account-form";
import { EmailChatBox } from "./email-chat-box";
import { useEmailAgentActions, type EmailAgentResultPayload } from "../hooks/use-email-agent-actions";
import { useEmailCopilotContext } from "../hooks/use-email-copilot-context";
import { EmailComposeForm } from "./email-compose-form";
import { EmailAIPanel } from "./email-ai-panel";
import { EmailDetailPane } from "./email-detail-pane";
import { EmailHeader } from "./email-header";
import { EmailList } from "./email-list";
import type { FolderSelection } from "./email-sidebar-nav";
import { EmailSidebarNav } from "./email-sidebar-nav";
import { EmailSpamDialog } from "./email-spam-dialog";

interface EmailWorkspaceProps {
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
}

export function EmailWorkspace({
  defaultLayout = [265, 440, 655],
  defaultCollapsed = false,
  navCollapsedSize,
}: EmailWorkspaceProps) {
  const isNarrow = useMediaQuery("(max-width: 1280px)");
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isPending, startTransition] = useTransition();
  const [openSpam, setOpenSpam] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [openChatBox, setOpenChatBox] = useState(false);

  const [booting, setBooting] = useState(true);
  const [account, setAccount] = useState<EmailAccountResponse | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [folders, setFolders] = useState<EmailFolderResponse[]>([]);
  const [folderSelection, setFolderSelection] = useState<FolderSelection | null>(null);
  const [messages, setMessages] = useState<EmailMessageResponse[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<EmailContactView[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [readFilter, setReadFilter] = useState<"all" | "read" | "unread">("all");

  const { selectedMail, setSelectedMail, composeMode, setComposeMode, clearMessageSelection } =
    useEmailStore();
  const [mailAiResult, setMailAiResult] = useState<EmailAgentResultPayload | null>(null);
  const [composeAiResult, setComposeAiResult] = useState<EmailAgentResultPayload | null>(null);
  const composePlainTextRef = useRef<() => string>(() => "");

  const folderCtx = useMemo(
    () =>
      folderSelection
        ? folderSelection.folder_type === "custom"
          ? { folder_path: folderSelection.folder_path }
          : { folder_type: folderSelection.folder_type }
        : null,
    [folderSelection],
  );

  useEmailCopilotContext({
    selectedMail,
    folder: folderCtx,
    accountEmail: account?.email_address ?? null,
  });

  const handleAgentResult = useCallback((payload: EmailAgentResultPayload) => {
    if (payload.action === "polish_compose" || payload.action === "translate_compose") {
      setComposeAiResult(payload);
    } else {
      setMailAiResult(payload);
    }
  }, []);

  const aiActions = useEmailAgentActions({
    selectedMail,
    getComposePlainText: () => composePlainTextRef.current(),
    onResult: handleAgentResult,
  });
  const setCachedAccount = useEmailAccountStore((s) => s.setCachedAccount);

  const buildListParams = useCallback(
    (sel: FolderSelection): EmailListParams => {
      const params: EmailListParams = {};
      if (sel.folder_type === "custom") params.folder_path = sel.folder_path;
      else params.folder_type = sel.folder_type;
      if (appliedSearch.trim()) params.search = appliedSearch.trim();
      if (readFilter === "read") params.is_read = true;
      if (readFilter === "unread") params.is_read = false;
      return params;
    },
    [appliedSearch, readFilter],
  );

  const loadMessages = useCallback(
    async (sel: FolderSelection | null) => {
      if (!sel) return;
      const res = await listEmailMessages(buildListParams(sel));
      if (!res.success) {
        setListError(res.error.message);
        return;
      }
      setListError(null);
      setMessages(res.data.items);
    },
    [buildListParams],
  );

  const reloadFoldersAndMessages = useCallback(async () => {
    const f = await listEmailFolders();
    if (f.success) setFolders(f.data);
    if (folderSelection) await loadMessages(folderSelection);
  }, [folderSelection, loadMessages]);

  const { isSyncing, lastError: syncError, setLastError: setSyncError, syncNow } = useEmailSync({
    enabled: !!account,
    onAfterSync: reloadFoldersAndMessages,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBooting(true);
      setBootError(null);
      const chat = await getEmailDemoContacts();
      if (!cancelled) setContacts(chat.contacts);

      const accRes = await fetchEmailAccount();
      if (cancelled) return;
      if (!accRes.success) {
        setBootError(accRes.error.message);
        setAccount(null);
        setCachedAccount(null);
        setBooting(false);
        return;
      }
      setAccount(accRes.data);
      setCachedAccount(accRes.data);
      if (!accRes.data) {
        setFolders([]);
        setFolderSelection(null);
        setMessages([]);
        setBooting(false);
        return;
      }

      const foldRes = await listEmailFolders();
      if (cancelled) return;
      if (!foldRes.success) {
        setListError(foldRes.error.message);
        setFolders([]);
        setBooting(false);
        return;
      }
      setFolders(foldRes.data);
      const inbox =
        foldRes.data.find((x) => x.type === "inbox") ?? foldRes.data[0] ?? null;
      if (inbox) {
        setFolderSelection({ folder_type: inbox.type, folder_path: inbox.path });
      }
      setBooting(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [setCachedAccount]);

  useEffect(() => {
    if (!folderSelection || !account) return;
    void loadMessages(folderSelection);
  }, [account, folderSelection, loadMessages]);

  const handleSelectFolder = (sel: FolderSelection) => {
    setFolderSelection(sel);
    setSelectedMail(null);
    setDetailError(null);
    clearMessageSelection();
  };

  const handleOpenMail = (id: string) => {
    setDetailError(null);
    startTransition(async () => {
      const res = await getEmailMessage(id);
      if (!res.success) {
        setDetailError(res.error.message);
        toast.error(res.error.message);
        return;
      }
      setSelectedMail(res.data);
    });
  };

  const handleAccountCreated = async () => {
    const accRes = await fetchEmailAccount();
    if (!accRes.success || !accRes.data) {
      setBootError(accRes.success ? "绑定后未读取到账号" : accRes.error.message);
      return;
    }
    setAccount(accRes.data);
    setCachedAccount(accRes.data);
    const foldRes = await listEmailFolders();
    if (foldRes.success) {
      setFolders(foldRes.data);
      const inbox =
        foldRes.data.find((x) => x.type === "inbox") ?? foldRes.data[0] ?? null;
      if (inbox) {
        setFolderSelection({ folder_type: inbox.type, folder_path: inbox.path });
      }
    }
  };

  const handleAccountRemoved = () => {
    setAccount(null);
    setCachedAccount(null);
    setFolders([]);
    setFolderSelection(null);
    setMessages([]);
    setSelectedMail(null);
    clearMessageSelection();
  };

  const layoutSizes = useMemo(() => {
    if (!defaultLayout?.length) return [18, 52, 30];
    if (defaultLayout.length === 2) return [...defaultLayout, 28];
    if (defaultLayout.length >= 3) return defaultLayout.slice(0, 3);
    return [18, 52, 30];
  }, [defaultLayout]);

  if (booting) {
    return (
      <div className="app-height flex items-center justify-center text-sm text-default-500">
        加载邮箱工作区…
      </div>
    );
  }

  if (bootError) {
    return (
      <div className="app-height flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>无法加载邮箱</CardTitle>
            <CardDescription>{bootError}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="app-height flex items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>绑定邮箱账号</CardTitle>
            <CardDescription>
              当前工作区尚未绑定邮箱。请填写以下信息以连接 IMAP/POP3 与 SMTP（单账号）。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailAccountForm
              key="create-account"
              mode="create"
              onSuccess={() => void handleAccountCreated()}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {composeMode !== null && account && (
        <EmailComposeForm
          editorPlainTextRef={composePlainTextRef}
          composeAiResult={composeAiResult}
          onClearComposeAi={() => setComposeAiResult(null)}
          runPolishCompose={aiActions.runPolishCompose}
          runTranslatePlainText={aiActions.runTranslatePlainText}
          onClose={() => {}}
          onSent={() => void reloadFoldersAndMessages()}
        />
      )}
      {openChatBox && <EmailChatBox onClose={() => setOpenChatBox(false)} />}
      <div className="app-height relative z-10 overflow-hidden">
        {isNarrow && showSidebar && (
          <div
            className="absolute inset-0 z-[99] w-full flex-1 rounded-md bg-background/60 backdrop-blur-sm backdrop-filter"
            onClick={() => setShowSidebar(false)}
          />
        )}
        {isNarrow && showSidebar && (
          <div
            className={cn("absolute top-0 z-[999] h-full w-[200px] md:w-[260px]", {
              "left-0": isNarrow && showSidebar,
              "-left-full": isNarrow && !showSidebar,
            })}
          >
            <div className="h-full overflow-auto no-scrollbar bg-background px-1 pt-2">
              <EmailSidebarNav
                isCollapsed={false}
                folders={folders}
                selected={
                  folderSelection ?? {
                    folder_type: "inbox",
                    folder_path: "INBOX",
                  }
                }
                onSelect={(sel) => {
                  handleSelectFolder(sel);
                  setShowSidebar(false);
                }}
                onCompose={() => {
                  setComposeMode("new");
                  setShowSidebar(false);
                }}
              />
            </div>
          </div>
        )}
        <TooltipProvider delayDuration={0}>
          <ResizablePanelGroup
            direction="horizontal"
            onLayout={(sizes) => {
              document.cookie = `react-resizable-panels:layout=${JSON.stringify(sizes)}`;
            }}
            className="relative"
          >
            {!isNarrow && (
              <ResizablePanel
                defaultSize={layoutSizes[0]}
                collapsedSize={navCollapsedSize}
                collapsible
                minSize={12}
                maxSize={20}
                onCollapse={() => {
                  setIsCollapsed(false);
                  document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(true)}`;
                }}
                className={cn(
                  isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out",
                )}
              >
                <div className="h-full overflow-auto no-scrollbar">
                  <EmailSidebarNav
                    isCollapsed={isCollapsed}
                    folders={folders}
                    selected={
                      folderSelection ?? {
                        folder_type: "inbox",
                        folder_path: "INBOX",
                      }
                    }
                    onSelect={handleSelectFolder}
                    onCompose={() => setComposeMode("new")}
                  />
                </div>
              </ResizablePanel>
            )}
            {!isNarrow && <ResizableHandle withHandle />}
            <ResizablePanel defaultSize={isNarrow ? 72 : layoutSizes[1]} minSize={30}>
              <Card className="h-full">
                <CardContent className="h-full overflow-y-auto px-0 no-scrollbar">
                  {!isPending && (
                    <div className="sticky top-0 z-50 mb-1 flex flex-row flex-wrap items-center gap-4 space-y-1.5 rounded-t-md border-b border-none border-border bg-card px-6 pt-6">
                      <EmailHeader
                        selectedMail={selectedMail}
                        onClose={() => {
                          setSelectedMail(null);
                          setDetailError(null);
                        }}
                        handleSpam={() => setOpenSpam((value) => !value)}
                        handleSidebar={() => setShowSidebar((value) => !value)}
                        search={searchInput}
                        onSearchChange={setSearchInput}
                        onSearchApply={() => {
                          setAppliedSearch(searchInput);
                          setSyncError(null);
                        }}
                        hasAccount={!!account}
                        canSync={true}
                        isSyncing={isSyncing}
                        syncError={syncError}
                        lastSyncAt={account.last_sync_at}
                        onSync={async () => {
                          setSyncError(null);
                          const r = await syncNow();
                          if (!r.ok && "error" in r && r.error) {
                            setSyncError(r.error);
                          }
                        }}
                        readFilter={readFilter}
                        onReadFilterChange={(v) => {
                          setReadFilter(v);
                          setSyncError(null);
                        }}
                        visibleMessageIds={messages.map((m) => m.id)}
                        onAfterBatchAction={() => {
                          if (folderSelection) void loadMessages(folderSelection);
                        }}
                        onCompose={() => setComposeMode("new")}
                      />
                    </div>
                  )}
                  {selectedMail ? (
                    <>
                      {detailError && (
                        <div className="m-6 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                          {detailError}
                        </div>
                      )}
                      <EmailDetailPane
                        mail={selectedMail}
                        listMessages={messages}
                        onMailUpdated={() => {
                          if (folderSelection) void loadMessages(folderSelection);
                        }}
                        runSummarizeEmail={aiActions.runSummarizeEmail}
                        runDraftReply={aiActions.runDraftReply}
                        runExtractTasks={aiActions.runExtractTasks}
                      />
                    </>
                  ) : isPending ? (
                    <div className="px-6 py-10 text-sm text-default-500">加载邮件详情…</div>
                  ) : listError ? (
                    <div className="m-6 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                      {listError}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="px-6 py-10 text-sm text-default-500">
                      此文件夹暂无邮件。可点击「同步」或检查账号设置。
                    </div>
                  ) : (
                    messages.map((m) => (
                      <EmailList
                        key={m.id}
                        message={m}
                        onOpen={handleOpenMail}
                        onMailboxChanged={() => void loadMessages(folderSelection)}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize={isNarrow ? 28 : layoutSizes[2]}
              minSize={0}
              maxSize={40}
              collapsible
              collapsedSize={0}
              className="min-w-0"
            >
              <EmailAIPanel
                selectedMail={selectedMail}
                accountEmail={account.email_address}
                result={mailAiResult}
                onClearResult={() => setMailAiResult(null)}
                onApplyToCompose={(md) => {
                  void navigator.clipboard.writeText(md);
                  setComposeMode("new");
                  toast.success("已复制到剪贴板，撰写窗口已打开");
                }}
                runSummarizeEmail={aiActions.runSummarizeEmail}
                runDraftReply={aiActions.runDraftReply}
                runTranslateEmail={aiActions.runTranslateEmail}
                runExtractTasks={aiActions.runExtractTasks}
                runExtractData={aiActions.runExtractData}
                runCustomAgent={aiActions.runCustomAgent}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </TooltipProvider>
      </div>
      <EmailSpamDialog open={openSpam} onClose={() => setOpenSpam(false)} />
    </>
  );
}
