"use client";

import { useState } from "react";
import { Download, FileIcon } from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import type { EmailAttachmentResponse } from "@portal/shared";

import { formatAttachmentSize } from "../lib/email-address-utils";
import { downloadEmailAttachment } from "../services/email-api";

interface EmailAttachmentListProps {
  attachments: EmailAttachmentResponse[];
}

export function EmailAttachmentList({ attachments }: EmailAttachmentListProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (!attachments.length) return null;

  const handleDownload = async (a: EmailAttachmentResponse) => {
    setDownloadingId(a.id);
    try {
      const name = a.filename ?? "attachment";
      const res = await downloadEmailAttachment(a.id, name);
      if (!res.success) {
        toast.error(res.error.message);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="mt-4">
      <div className="text-base font-medium text-default-900">
        附件（{attachments.length}）
      </div>
      <ul className="mt-3 space-y-2">
        {attachments.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between gap-3 rounded-md border border-default-200 bg-default-50/50 px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <FileIcon className="h-4 w-4 shrink-0 text-default-500" />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-default-900">
                  {a.filename ?? "未命名附件"}
                </div>
                <div className="text-xs text-default-500">
                  {a.content_type ?? "application/octet-stream"} ·{" "}
                  {formatAttachmentSize(a.size_bytes)}
                </div>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={downloadingId === a.id}
              onClick={() => void handleDownload(a)}
            >
              <Download className="h-3.5 w-3.5 ltr:mr-1 rtl:ml-1" />
              {downloadingId === a.id ? "…" : "下载"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
