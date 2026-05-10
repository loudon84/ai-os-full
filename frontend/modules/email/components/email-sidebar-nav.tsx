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
}

export function EmailSidebarNav({
  isCollapsed,
  folders,
  selected,
  onSelect,
}: EmailSidebarNavProps) {
  const isActive = (f: EmailFolderResponse) =>
    f.type === selected.folder_type && f.path === selected.folder_path;

  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex flex-col gap-1 py-2 data-[collapsed=true]:py-2"
    >
      <nav className="grid gap-1 group-[[data-collapsed=true]]:justify-center">
        {folders.map((folder, index) => {
          const icon = folderTypeIcon(folder.type);
          const label = `${folder.unread_count}/${folder.total_count}`;
          const title = folder.name || folder.path;

          return isCollapsed ? (
            <Tooltip key={`${folder.path}-${index}`} delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex justify-center rounded px-1 py-2",
                    isActive(folder) ? "bg-primary/15 text-primary" : "hover:bg-primary/10",
                  )}
                  onClick={() =>
                    onSelect({ folder_type: folder.type, folder_path: folder.path })
                  }
                >
                  <Icon icon={icon} className="h-[18px] w-[18px] text-default-600" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-2 capitalize">
                <span>{title}</span>
                <span className="text-default-500">{label}</span>
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
                "flex cursor-pointer items-center gap-1.5 rounded px-3 py-2.5 capitalize duration-200 ease-in-out hover:bg-primary/10",
                isActive(folder) && "bg-primary/15 text-primary",
              )}
            >
              <Icon icon={icon} className="h-4 w-4 flex-none text-default-600" />
              <span className="flex-1 truncate text-start text-sm font-medium text-default-600">
                {title}
              </span>
              <span className="text-end text-xs text-default-500">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
