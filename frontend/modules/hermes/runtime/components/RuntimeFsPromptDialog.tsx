"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RuntimeFsPromptDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  defaultValue,
  submitLabel,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  submitLabel?: string;
  onSubmit: (value: string) => Promise<void> | void;
}) {
  const initial = useMemo(() => defaultValue ?? "", [defaultValue]);
  const [value, setValue] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = value.trim().length > 0 && !submitting;

  useEffect(() => {
    if (open) setValue(initial);
  }, [open, initial]);

  const submit = async () => {
    const next = value.trim();
    if (!next) return;
    setSubmitting(true);
    try {
      await onSubmit(next);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="grid gap-2 py-1">
          <Input
            autoFocus
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void submit();
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            取消
          </Button>
          <Button onClick={() => void submit()} disabled={!canSubmit}>
            {submitLabel ?? "确定"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

