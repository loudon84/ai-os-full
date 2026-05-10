"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Icon } from "@iconify/react";
import { Plus } from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import type {
  EmailAccountResponse,
  EmailFolderResponse,
  EmailListParams,
  EmailMessageResponse,
} from "@portal/shared";

import { EMAIL_PERMISSION } from "../constants/permissions";
import { useEmailSync } from "../hooks/use-email-sync";
import { useEmailPermission } from "../hooks/use-email-permission";
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
import { EmailAccountCard } from "./email-account-card";
import { EmailAccountForm } from "./email-account-form";
import { EmailChatBox } from "./email-chat-box";
import { EmailComposeForm } from "./email-compose-form";
import { EmailContactList } from "./email-contact-list";
import { EmailDetail } from "./email-detail";
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
  const [openComposeMail, setOpenComposeMail] = useState(false);
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

  const { selectedMail, setSelectedMail } = useEmailStore();
  const setCachedAccount = useEmailAccountStore((s) => s.setCachedAccount);
  const canSync = useEmailPermission(EMAIL_PERMISSION.SYNC_RUN);

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
  };

  const handleAccountUpdatedFromCard = async () => {
    const accRes = await fetchEmailAccount();
    if (accRes.success && accRes.data) {
      setAccount(accRes.data);
      setCachedAccount(accRes.data);
    }
    await reloadFoldersAndMessages();
  };

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
      {openComposeMail && (
        <EmailComposeForm
          onClose={() => setOpenComposeMail(false)}
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
            <Card className="h-full overflow-auto pb-0 no-scrollbar">
              <CardHeader className="sticky top-0 z-50 mb-0 border-none bg-card px-6 pb-0 xl:mb-0">
                <Button onClick={() => setOpenComposeMail(true)} className="w-full">
                  <Plus className="h-4 w-4 ltr:mr-1 rtl:ml-1.5" />
                  撰写
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <EmailAccountCard
                  account={account}
                  onAccountRemoved={handleAccountRemoved}
                  onAccountUpdated={handleAccountUpdatedFromCard}
                />
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
                />
              </CardContent>
            </Card>
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
                defaultSize={defaultLayout[0]}
                collapsedSize={navCollapsedSize}
                collapsible
                minSize={15}
                maxSize={22}
                onCollapse={() => {
                  setIsCollapsed(true);
                  document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(true)}`;
                }}
                className={cn(
                  isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out",
                )}
              >
                <Card className="h-full overflow-auto no-scrollbar">
                  <CardHeader
                    className={cn(
                      "sticky top-0 z-[99] mb-0 border-none bg-card px-6 pb-0",
                      { "px-2": isCollapsed },
                    )}
                  >
                    <Button
                      size={isCollapsed ? "icon" : "default"}
                      onClick={() => setOpenComposeMail(true)}
                      className={isCollapsed ? "w-full" : ""}
                    >
                      <Plus
                        className={cn("h-4 w-4 ltr:mr-1 rtl:ml-1", {
                          "mr-0 h-5 w-5": isCollapsed,
                        })}
                      />
                      {!isCollapsed && "撰写"}
                    </Button>
                  </CardHeader>
                  <CardContent className={cn("space-y-3", { "px-2": isCollapsed })}>
                    {!isCollapsed && (
                      <EmailAccountCard
                        account={account}
                        onAccountRemoved={handleAccountRemoved}
                        onAccountUpdated={handleAccountUpdatedFromCard}
                      />
                    )}
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
                    />
                    <Separator />
                    {!isCollapsed && (
                      <div className="mx-4 mb-2 mt-4 text-xs font-medium uppercase text-default-800">
                        聊天
                      </div>
                    )}
                    {contacts.map((contact, index) => (
                      <EmailContactList
                        key={`email-contact-${contact.fullName}-${index}`}
                        contact={contact}
                        handleOpenChatBox={() => setOpenChatBox(true)}
                        isCollapsed={isCollapsed}
                      />
                    ))}
                  </CardContent>
                </Card>
              </ResizablePanel>
            )}
            {!isNarrow && <ResizableHandle withHandle />}
            <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
              <Card className="h-full">
                <CardContent className="h-full overflow-y-auto px-0 no-scrollbar">
                  {!isPending && (
                    <div className="sticky top-0 z-50 mb-1 flex flex-row flex-wrap gap-4 space-y-1.5 rounded-t-md border-b border-none border-border bg-card px-6 pt-6">
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
                        canSync={canSync}
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
                      <EmailDetail
                        mail={selectedMail}
                        onMailUpdated={() => {
                          if (folderSelection) void loadMessages(folderSelection);
                        }}
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
          </ResizablePanelGroup>
        </TooltipProvider>
      </div>
      <EmailSpamDialog open={openSpam} onClose={() => setOpenSpam(false)} />
    </>
  );
}
