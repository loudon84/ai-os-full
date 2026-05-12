"use client";

import { Icon } from "@iconify/react";

import type { EmailFolderResponse } from "@portal/shared";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { folderTypeIcon } from "../lib/folder-icons";

export interface FolderSelection {
  folder_type: EmailFolderResponse["type"];
  folder_path: string;
}

interface EmailSidebarNavProps {
  isCollapsed: boolean;
  folders: EmailFolderResponse[];
  selected: FolderSelection;
  onSelect: (sel: FolderSelection) => void;
  onCompose?: () => void;
}

export function EmailSidebarNav({
  isCollapsed,
  folders,
  selected,
  onSelect,
  onCompose,
}: EmailSidebarNavProps) {
  const isActive = (f: EmailFolderResponse) =>
    f.type === selected.folder_type && f.path === selected.folder_path;

  const systemFolders = folders.filter((f) => f.type !== "custom");
  const customFolders = folders.filter((f) => f.type === "custom");

  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex flex-col py-1 data-[collapsed=true]:py-1"
    >
      {!isCollapsed && onCompose && (
        <button
          type="button"
          onClick={onCompose}
          className="mx-2 mb-3 flex items-center gap-2 rounded-2xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Icon icon="heroicons:pencil" className="h-4 w-4" />
          <span>撰写</span>
        </button>
      )}

      {isCollapsed && onCompose && (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onCompose}
              className="mx-1 mb-2 flex justify-center rounded-xl bg-primary px-2 py-2 text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Icon icon="heroicons:pencil" className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">撰写</TooltipContent>
        </Tooltip>
      )}

      <nav className="grid gap-0.5 group-[[data-collapsed=true]]:justify-center">
        {systemFolders.map((folder, index) => {
          const icon = folderTypeIcon(folder.type);
          const title = folder.name || folder.path;
          const hasUnread = folder.unread_count > 0;

          return isCollapsed ? (
            <Tooltip key={`${folder.path}-${index}`} delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex justify-center rounded-lg px-2 py-2 transition-colors",
                    isActive(folder)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                  onClick={() =>
                    onSelect({ folder_type: folder.type, folder_path: folder.path })
                  }
                >
                  <Icon icon={icon} className="h-[18px] w-[18px] shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-2">
                <span>{title}</span>
                {hasUnread && (
                  <span className="text-muted-foreground">{folder.unread_count}</span>
                )}
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              key={`${folder.path}-${index}`}
              type="button"
              onClick={() =>
                onSelect({ folder_type: folder.type, folder_path: folder.path })
              }
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors",
                isActive(folder)
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-foreground hover:bg-muted",
              )}
            >
              <Icon
                icon={icon}
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  isActive(folder) ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span className="flex-1 truncate text-start">{title}</span>
              {hasUnread && (
                <span className="text-end text-xs font-medium text-primary">
                  {folder.unread_count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {!isCollapsed && customFolders.length > 0 && (
        <>
          <div className="mx-3 mt-3 mb-1 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              标签
            </span>
          </div>
          <nav className="grid gap-0.5">
            {customFolders.map((folder, index) => {
              const icon = folderTypeIcon(folder.type);
              const title = folder.name || folder.path;
              const hasUnread = folder.unread_count > 0;

              return (
                <button
                  key={`${folder.path}-${index}`}
                  type="button"
                  onClick={() =>
                    onSelect({ folder_type: folder.type, folder_path: folder.path })
                  }
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors",
                    isActive(folder)
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  <Icon
                    icon={icon}
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      isActive(folder) ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span className="flex-1 truncate text-start">{title}</span>
                  {hasUnread && (
                    <span className="text-end text-xs font-medium text-primary">
                      {folder.unread_count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </>
      )}
    </div>
  );
}
