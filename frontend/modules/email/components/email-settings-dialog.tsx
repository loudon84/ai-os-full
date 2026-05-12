"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmailSettingsPanel } from "@/modules/email/components/email-settings-panel";

type EmailSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EmailSettingsDialog({ open, onOpenChange }: EmailSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="2xl" className="overflow-y-auto">
        <DialogHeader>
          <DialogTitle>邮箱设置</DialogTitle>
        </DialogHeader>
        {open ? <EmailSettingsPanel /> : null}
      </DialogContent>
    </Dialog>
  );
}
