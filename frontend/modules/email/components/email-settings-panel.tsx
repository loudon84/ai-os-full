"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { EmailAccountResponse } from "@portal/shared";
import { EmailAccountForm } from "@/modules/email/components/email-account-form";
import {
  fetchEmailAccount,
  deleteEmailAccount,
  testEmailConnection,
} from "@/modules/email/services/email-api";

/**
 * 邮箱账号绑定/编辑、连接测试、删除（与 `/email/settings` 页同源逻辑）。
 */
export function EmailSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<EmailAccountResponse | null>(null);
  const [testing, setTesting] = useState(false);

  const loadAccount = useCallback(async () => {
    setLoading(true);
    const res = await fetchEmailAccount();
    if (res.success) setAccount(res.data);
    else toast.error(res.error.message);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  const handleDelete = async () => {
    const res = await deleteEmailAccount();
    if (res.success) {
      toast.success("邮箱账号已删除");
      setAccount(null);
    } else {
      toast.error(res.error.message);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    const res = await testEmailConnection({} as never);
    if (res.success) {
      toast.success("连接测试成功");
    } else {
      toast.error(res.error.message ?? "连接测试失败");
    }
    setTesting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center py-12">
        <Icon icon="heroicons:arrow-path" className="h-6 w-6 animate-spin text-default-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>邮箱账号配置</CardTitle>
          <CardDescription>
            {account
              ? "修改当前绑定的邮箱账号设置，或删除后重新绑定。"
              : "当前工作区尚未绑定邮箱，请填写以下信息以连接 IMAP/POP3 与 SMTP。"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmailAccountForm
            key={account ? "edit" : "create"}
            mode={account ? "edit" : "create"}
            account={account}
            onSuccess={() => void loadAccount()}
          />
        </CardContent>
      </Card>

      {account && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>连接测试</CardTitle>
              <CardDescription>验证当前邮箱账号的 IMAP/SMTP 连接是否正常。</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" onClick={() => void handleTest()} disabled={testing}>
                  {testing && (
                    <Icon icon="heroicons:arrow-path" className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {testing ? "测试中…" : "测试连接"}
                </Button>
                <span className="text-sm text-default-500">
                  最后同步：{account.last_sync_at ?? "从未"}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">危险操作</CardTitle>
              <CardDescription>
                删除邮箱账号将清除所有已同步的邮件数据，此操作不可恢复。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button color="destructive">删除邮箱账号</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认删除邮箱账号？</AlertDialogTitle>
                    <AlertDialogDescription>
                      将删除 {account.email_address} 的所有配置和已同步邮件，此操作不可恢复。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => void handleDelete()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      确认删除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
