"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { EmailContactView } from "../types/email-view";

interface EmailContactListProps {
  contact: EmailContactView;
  handleOpenChatBox: () => void;
  isCollapsed: boolean;
}

export function EmailContactList({
  contact,
  handleOpenChatBox,
  isCollapsed,
}: EmailContactListProps) {
  const { avatar, fullName, status, about, chat } = contact;

  if (isCollapsed) {
    return (
      <div className={cn("flex cursor-pointer gap-4 rounded px-2 py-1.5 hover:bg-default-300")}>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-block">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={avatar?.src} />
                  <AvatarFallback className="uppercase">{fullName.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <Badge
                  className="absolute left-[calc(100%-8px)] top-[calc(100%-10px)] h-2 w-2 items-center justify-center p-0 ring-1 ring-border ring-offset-[1px]"
                  color={status === "online" ? "success" : "secondary"}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className="max-w-[120px] truncate">
                <span className="text-sm font-medium text-default-900">{fullName}</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div
      className="flex cursor-pointer gap-4 rounded border-l-2 border-transparent px-2.5 py-2.5 duration-200 ease-in-out hover:!rounded-l-none hover:border-primary-500 hover:bg-default-100 dark:hover:bg-default-300"
      onClick={handleOpenChatBox}
    >
      <div className="flex flex-1 gap-3">
        <div className="relative inline-block">
          <Avatar>
            <AvatarImage src={avatar?.src} />
            <AvatarFallback className="uppercase">{fullName.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <Badge
            className="absolute left-[calc(100%-8px)] top-[calc(100%-10px)] h-2 w-2 items-center justify-center p-0 ring-1 ring-border ring-offset-[1px]"
            color={status === "online" ? "success" : "secondary"}
          />
        </div>
        <div className="hidden lg:block">
          <div className="max-w-[120px] truncate">
            <span className="text-sm font-medium text-default-900">{fullName}</span>
          </div>
          <div className="max-w-[120px] truncate">
            <span className="text-xs text-default-600">{chat?.lastMessage ?? about}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
