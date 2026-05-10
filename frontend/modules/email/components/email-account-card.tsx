"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EmailAccountResponse, TestConnectionRequest } from "@portal/shared";

import { EMAIL_PERMISSION } from "../constants/permissions";
import { useEmailPermission } from "../hooks/use-email-permission";
import { useEmailAccountStore } from "../stores/email-account-store";
import { deleteEmailAccount, testEmailConnection } from "../services/email-api";
import { EmailAccountForm } from "./email-account-form";

interface EmailAccountCardProps {
  account: EmailAccountResponse;
  onAccountRemoved?: () => void;
  onAccountUpdated?: () => void | Promise<void>;
}

function toTestPayload(account: EmailAccountResponse, password: string): TestConnectionRequest {
  return {
    email_address: account.email_address,
    display_name: account.display_name,
    provider_type: account.provider_type,
    receive_protocol: account.receive_protocol,
    imap_host: account.imap_host,
    imap_port: account.imap_port,
    imap_secure: account.imap_secure,
    pop3_host: account.pop3_host,
    pop3_port: account.pop3_port,
    pop3_secure: account.pop3_secure,
    smtp_host: account.smtp_host,
    smtp_port: account.smtp_port,
    smtp_secure: account.smtp_secure,
    smtp_require_starttls: account.smtp_require_starttls,
    username: account.username,
    password,
    sync_interval_seconds: account.sync_interval_seconds,
  };
}

export function EmailAccountCard({
  account,
  onAccountRemoved,
  onAccountUpdated,
}: EmailAccountCardProps) {
  const canTest = useEmailPermission(EMAIL_PERMISSION.ACCOUNT_TEST);
  const setLastTest = useEmailAccountStore((s) => s.setLastConnectionTest);

  const [editOpen, setEditOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testPassword, setTestPassword] = useState("");
  const [testing, setTesting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const runTest = async () => {
    if (!testPassword.trim()) {
      toast.error("请输入邮箱密码以测试连接");
      return;
    }
    setTesting(true);
    try {
      const res = await testEmailConnection(toTestPayload(account, testPassword));
      if (!res.success) {
        toast.error(res.error.message);
        setLastTest(null);
        return;
      }
      setLastTest(res.data);
      const { receive, smtp } = res.data;
      if (receive.success && smtp.success) {
        toast.success("收件与发信检测均通过");
      } else {
        toast.error(
          [
            !receive.success ? `收件：${receive.error ?? "失败"}` : null,
            !smtp.success ? `发信：${smtp.error ?? "失败"}` : null,
          ]
            .filter(Boolean)
            .join("；"),
        );
      }
      setTestOpen(false);
      setTestPassword("");
    } finally {
      setTesting(false);
    }
  };

  const runDelete = async () => {
    setDeleting(true);
    try {
      const res = await deleteEmailAccount();
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success("已删除邮箱绑定");
      onAccountRemoved?.();
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div className="rounded-md border border-default-200 bg-card p-3 text-sm">
      <div className="font-medium text-default-900">{account.email_address}</div>
      {account.display_name && (
        <div className="text-default-600">{account.display_name}</div>
      )}
      <div className="mt-2 space-y-1 text-xs text-default-500">
        <div>状态：{account.status}</div>
        <div>
          上次同步：
          {account.last_sync_at
            ? new Date(account.last_sync_at).toLocaleString()
            : "尚未同步"}
        </div>
        {account.last_sync_error && (
          <div className="text-destructive">同步错误：{account.last_sync_error}</div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
          编辑配置
        </Button>
        {canTest && (
          <Button type="button" size="sm" variant="outline" onClick={() => setTestOpen(true)}>
            测试连接
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
        >
          删除绑定
        </Button>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑邮箱账号</DialogTitle>
            <DialogDescription>修改连接参数或密码（留空则不更新密码）。</DialogDescription>
          </DialogHeader>
          <EmailAccountForm
            key={account.id}
            mode="edit"
            account={account}
            onSuccess={() => {
              setEditOpen(false);
              void onAccountUpdated?.();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>测试邮箱连接</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-default-600">
            请输入当前邮箱密码，系统将检测收件（IMAP/POP3）与 SMTP 发信。
          </p>
          <div className="space-y-2">
            <Label htmlFor="test-pw">密码</Label>
            <Input
              id="test-pw"
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTestOpen(false)}>
              取消
            </Button>
            <Button type="button" disabled={testing} onClick={() => void runTest()}>
              {testing ? "检测中…" : "开始检测"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除邮箱绑定？</AlertDialogTitle>
            <AlertDialogDescription>
              将移除当前工作区下的邮箱账号配置，本地已同步邮件可能被清理策略影响，请谨慎操作。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction disabled={deleting} onClick={() => void runDelete()}>
              {deleting ? "删除中…" : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
