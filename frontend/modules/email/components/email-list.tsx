"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";

import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { EmailMessageResponse } from "@portal/shared";

import { EMAIL_PERMISSION } from "../constants/permissions";
import { useEmailPermission } from "../hooks/use-email-permission";
import { deleteEmailMessage, updateEmailMessage } from "../services/email-api";
import { useEmailStore } from "../stores/email-store";

interface EmailListProps {
  message: EmailMessageResponse;
  onOpen: (id: string) => void;
  onMailboxChanged?: () => void;
}

function listFromLabel(m: EmailMessageResponse): string {
  return m.from?.name ?? m.from?.address ?? m.to[0]?.address ?? "未知发件人";
}

function listDate(m: EmailMessageResponse): string {
  return m.date ?? m.received_at ?? m.sent_at ?? m.created_at;
}

export function EmailList({ message, onOpen, onMailboxChanged }: EmailListProps) {
  const canMutate = useEmailPermission(EMAIL_PERMISSION.MESSAGE_MUTATE);
  const selectedIds = useEmailStore((s) => s.selectedMessageIds);
  const toggleMessageSelection = useEmailStore((s) => s.toggleMessageSelection);
  const [open, setOpen] = useState(false);
  const [starPending, setStarPending] = useState(false);

  const { id } = message;
  const starred = message.is_starred;
  const label = listFromLabel(message);
  const text = message.snippet ?? message.text_body ?? "";
  const dateStr = listDate(message);
  const isSelected = selectedIds.has(id);

  const toggleStar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canMutate) {
      toast.error("无权限修改邮件");
      return;
    }
    setStarPending(true);
    try {
      const res = await updateEmailMessage(id, { is_starred: !starred });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      onMailboxChanged?.();
    } finally {
      setStarPending(false);
    }
  };

  return (
    <>
      <DeleteConfirmationDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={async () => {
          if (!canMutate) {
            toast.error("无权限删除邮件");
            return;
          }
          const res = await deleteEmailMessage(id);
          if (!res.success) {
            toast.error(res.error.message);
            return;
          }
          onMailboxChanged?.();
        }}
      />
      <div
        className={cn(
          "group relative flex cursor-pointer items-center border-b border-default-100 px-6 py-5 hover:bg-primary/10",
          { "bg-primary/10 hover:bg-primary/10": isSelected },
          !message.is_read && "font-semibold",
        )}
        onClick={() => onOpen(id)}
      >
        <Checkbox
          className="border-default-300 p-0 ltr:mr-6 rtl:ml-6"
          checked={isSelected}
          onCheckedChange={() => toggleMessageSelection(id)}
          onClick={(event) => event.stopPropagation()}
        />
        <div className="ltr:mr-6 rtl:ml-6" onClick={toggleStar}>
          <Icon
            icon={starred ? "heroicons:star-16-solid" : "heroicons:star"}
            className={cn("h-4 w-4 text-default-600", {
              "text-yellow-400": starred,
              "opacity-50": starPending,
            })}
          />
        </div>
        <div className="mr-4 min-w-max text-sm text-default-600">{label}</div>
        <div className="mr-7 min-w-[100px] flex-1 flex-shrink overflow-hidden">
          <p className="truncate text-sm text-default-600">{text}</p>
        </div>
        <div
          className={cn("h-2 w-2 rounded-full bg-default-300 ltr:mr-1.5 rtl:ml-1.5", {
            "bg-primary": message.folder_type === "inbox",
            "bg-warning": message.folder_type === "sent",
          })}
        />
        <div className="whitespace-nowrap text-sm text-default-600">
          {formatDistanceToNow(new Date(dateStr), { addSuffix: true })}
        </div>
        {canMutate && (
          <div className="absolute top-0 z-10 hidden h-full w-fit items-center bg-background px-5 ltr:right-0 rtl:left-0 md:group-hover:flex">
            <Button
              onClick={(event) => {
                event.stopPropagation();
                setOpen(true);
              }}
              size="icon"
              className="rounded-full bg-transparent hover:bg-default-50"
            >
              <Icon icon="heroicons:trash" className="h-5 w-5 text-default-600" />
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
