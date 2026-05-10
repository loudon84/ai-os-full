"use client";

import { Fragment } from "react";
import { Icon } from "@iconify/react";
import {
  ChevronDown,
  ListFilter,
  Loader2,
  MailCheck,
  Menu,
  MicOff,
  Paperclip,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupText } from "@/components/ui/input-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { EmailMessageResponse } from "@portal/shared";

interface EmailHeaderProps {
  selectedMail: EmailMessageResponse | null;
  onClose: () => void;
  handleSpam: () => void;
  handleSidebar: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  onSearchApply: () => void;
  hasAccount: boolean;
  canSync: boolean;
  isSyncing: boolean;
  syncError: string | null;
  lastSyncAt: string | null;
  onSync: () => void;
  readFilter: "all" | "read" | "unread";
  onReadFilterChange: (v: "all" | "read" | "unread") => void;
}

export function EmailHeader({
  selectedMail,
  onClose,
  handleSpam,
  handleSidebar,
  search,
  onSearchChange,
  onSearchApply,
  hasAccount,
  canSync,
  isSyncing,
  syncError,
  lastSyncAt,
  onSync,
  readFilter,
  onReadFilterChange,
}: EmailHeaderProps) {
  const isDesktop = useMediaQuery("(max-width: 1280px)");

  return (
    <Fragment>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {isDesktop && (
            <Menu
              className="h-5 w-5 cursor-pointer text-default-600 me-2"
              onClick={handleSidebar}
            />
          )}
          {!selectedMail && (
            <div className="flex items-center gap-1">
              <Checkbox className="border-default-200" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" className="w-fit bg-transparent px-0 hover:bg-transparent">
                    <ChevronDown className="h-4 w-4 text-default-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[196px]" align="start">
                  <DropdownMenuItem
                    onClick={() => {
                      onReadFilterChange("all");
                      onSearchApply();
                    }}
                  >
                    全部{readFilter === "all" ? " ✓" : ""}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      onReadFilterChange("read");
                      onSearchApply();
                    }}
                  >
                    已读{readFilter === "read" ? " ✓" : ""}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      onReadFilterChange("unread");
                      onSearchApply();
                    }}
                  >
                    未读{readFilter === "unread" ? " ✓" : ""}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          {selectedMail && (
            <Button
              type="button"
              size="icon"
              className="h-9 w-9 rounded-full bg-default-100 hover:bg-default-200"
              onClick={onClose}
            >
              <Icon icon="heroicons:arrow-long-left" className="h-5 w-5 text-default-900" />
            </Button>
          )}
          <div>
            <HeaderIcon icon="heroicons:archive-box-arrow-down" label="归档（后续）" />
            <HeaderIcon icon="heroicons:exclamation-circle" label="举报垃圾邮件" onClick={handleSpam} />
            <HeaderIcon icon="heroicons:trash" label="删除（后续）" />
          </div>
          <div className="relative hidden px-3 before:absolute before:-top-4 before:left-1/2 before:h-9 before:w-px before:bg-default-300 before:content-[''] md:block" />
          <div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" className="rounded-full bg-transparent hover:bg-default-50">
                    {!selectedMail ? (
                      <MailCheck className="h-5 w-5 text-default-600" />
                    ) : (
                      <Icon icon="heroicons:envelope-open" className="h-5 w-5 text-default-600" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{!selectedMail ? "标记未读（后续）" : "标记已读（后续）"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" className="rounded-full bg-transparent hover:bg-default-50">
                  <Icon icon="heroicons:tag" className="h-5 w-5 text-default-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-fit" align="start">
                <DropdownMenuItem disabled>标签（后续）</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" className="rounded-full bg-transparent hover:bg-default-50">
                  <Icon icon="heroicons:ellipsis-vertical" className="h-5 w-5 text-default-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-fit" align="end">
                <DropdownMenuItem disabled>
                  <Icon icon="heroicons:paper-airplane" className="h-4 w-4 text-default-600 me-1.5" />
                  更多操作（后续）
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <ListFilter className="h-4 w-4 text-default-600 me-1.5" />
                  筛选
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <MicOff className="h-4 w-4 text-default-600 me-1.5" />
                  静音
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Paperclip className="h-4 w-4 text-default-600 me-1.5" />
                  作为附件转发
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="ms-2 flex flex-wrap items-center gap-2 border-l border-default-200 pl-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!hasAccount || !canSync || isSyncing}
                    onClick={() => void onSync()}
                  >
                    {isSyncing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="ms-1 hidden sm:inline">同步</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {!hasAccount
                    ? "请先绑定邮箱"
                    : lastSyncAt
                      ? `上次同步：${new Date(lastSyncAt).toLocaleString()}`
                      : "尚未同步"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {syncError && (
              <span className="max-w-[200px] truncate text-xs text-destructive" title={syncError}>
                {syncError}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="w-full flex-none lg:w-fit">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSearchApply();
          }}
        >
          <InputGroup merged>
            <InputGroupText>
              <Icon icon="heroicons:magnifying-glass" />
            </InputGroupText>
            <Input
              type="text"
              placeholder="搜索邮件…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </InputGroup>
          <Button type="submit" size="sm" variant="secondary" className="shrink-0">
            搜索
          </Button>
        </form>
      </div>
    </Fragment>
  );
}

function HeaderIcon({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onClick}
            size="icon"
            className="rounded-full bg-transparent hover:bg-default-50"
            type="button"
            disabled={!onClick}
          >
            <Icon icon={icon} className="h-5 w-5 text-default-600" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
