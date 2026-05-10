"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EmailSpamDialogProps {
  open: boolean;
  onClose: () => void;
}

export function EmailSpamDialog({ open, onClose }: EmailSpamDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="py-4" hiddenCloseIcon>
        <DialogHeader className="flex-row items-center justify-between">
          <DialogTitle className="text-base font-medium">Report spam or unsubscribe</DialogTitle>
          <Button
            onClick={onClose}
            size="icon"
            className="rounded-full bg-default-50 hover:bg-default-200"
          >
            <X className="h-5 w-5 text-default-500" />
          </Button>
        </DialogHeader>
        <div className="space-y-4 text-sm text-default-500">
          <div className="text-sm font-medium text-default-500">
            Dashmail can unsubscribe you by sending a message to{" "}
            <strong>unsubscribe@unsub.spmta.com.</strong>
          </div>
          <div>
            If you didn't sign up to receive this message, Report spam instead to help protect all
            Gmail users from unwanted email. Learn more
          </div>
        </div>
        <DialogFooter className="mt-3">
          <Button type="submit" variant="outline">
            Report Spam
          </Button>
          <Button type="submit">Unsubscribe</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
