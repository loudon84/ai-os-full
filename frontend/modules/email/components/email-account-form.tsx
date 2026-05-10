"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { EmailAccountResponse, EmailProviderType, EmailReceiveProtocol } from "@portal/shared";
import {
  EMAIL_PROVIDER_TYPES,
  EMAIL_RECEIVE_PROTOCOLS,
  emailAccountBaseSchema,
} from "@portal/shared";

import { getProviderPreset } from "../lib/provider-presets";
import { createEmailAccount, updateEmailAccount } from "../services/email-api";

const editAccountFormSchema = emailAccountBaseSchema
  .extend({
    password: z.string().max(2048).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.receive_protocol === "imap" && (!value.imap_host || !value.imap_port)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["imap_host"],
        message: "使用 IMAP 时必须填写 IMAP 主机与端口",
      });
    }
    if (value.receive_protocol === "pop3" && (!value.pop3_host || !value.pop3_port)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pop3_host"],
        message: "使用 POP3 时必须填写 POP3 主机与端口",
      });
    }
  });

type CreateFormValues = z.infer<typeof emailAccountBaseSchema>;
type EditFormValues = z.infer<typeof editAccountFormSchema>;

interface EmailAccountFormProps {
  mode: "create" | "edit";
  account?: EmailAccountResponse | null;
  onSuccess?: () => void;
}

const PROVIDERS_REQUIRING_APP_PASSWORD: readonly EmailProviderType[] = [
  "gmail",
  "aliyun_enterprise",
  "tencent_exmail",
] as const;

function isAppPasswordProvider(p: EmailProviderType): boolean {
  return (PROVIDERS_REQUIRING_APP_PASSWORD as readonly string[]).includes(p);
}

function providerLabel(p: EmailProviderType): string {
  switch (p) {
    case "gmail":
      return "Gmail";
    case "netease_163":
      return "网易 163";
    case "aliyun_enterprise":
      return "阿里企业邮";
    case "tencent_exmail":
      return "腾讯企业邮";
    case "custom":
      return "自定义";
    default:
      return p;
  }
}

function getAppPasswordHint(p: EmailProviderType): string | null {
  switch (p) {
    case "gmail":
      return "前往 Google 账号 → 安全性 → 应用密码 生成安全码";
    case "aliyun_enterprise":
      return "前往阿里企业邮箱 → 安全设置 → 客户端安全码 生成";
    case "tencent_exmail":
      return "前往腾讯企业邮箱 → 设置 → 客户端安全码 生成";
    default:
      return null;
  }
}

export function EmailAccountForm({ mode, account, onSuccess }: EmailAccountFormProps) {
  const defaultValues = useMemo((): Partial<CreateFormValues> => {
    if (mode === "edit" && account) {
      return {
        email_address: account.email_address,
        display_name: account.display_name ?? undefined,
        provider_type: account.provider_type,
        receive_protocol: account.receive_protocol,
        imap_host: account.imap_host ?? "",
        imap_port: account.imap_port ?? undefined,
        imap_secure: account.imap_secure,
        pop3_host: account.pop3_host ?? "",
        pop3_port: account.pop3_port ?? undefined,
        pop3_secure: account.pop3_secure,
        smtp_host: account.smtp_host,
        smtp_port: account.smtp_port,
        smtp_secure: account.smtp_secure,
        smtp_require_starttls: account.smtp_require_starttls,
        username: account.email_address,
        password: "",
        sync_interval_seconds: account.sync_interval_seconds,
      };
    }
    const preset = getProviderPreset("gmail");
    return {
      email_address: "",
      display_name: undefined,
      username: "",
      password: "",
      provider_type: "gmail",
      sync_interval_seconds: 300,
      ...(preset ?? {
        receive_protocol: "imap" as const,
        imap_secure: true,
        pop3_secure: true,
        smtp_secure: true,
        smtp_require_starttls: false,
        smtp_host: "",
        smtp_port: 587,
      }),
    };
  }, [mode, account]);

  const resolver = useMemo(
    () =>
      zodResolver(
        mode === "create"
          ? emailAccountBaseSchema
          : editAccountFormSchema,
      ),
    [mode],
  );

  const form = useForm<CreateFormValues | EditFormValues>({
    resolver: resolver as never,
    defaultValues: defaultValues as never,
  });

  const { register, handleSubmit, setValue, watch, formState } = form;
  const receiveProtocol = watch("receive_protocol") as EmailReceiveProtocol;
  const providerType = watch("provider_type") as EmailProviderType;
  const emailAddress = watch("email_address");

  useEffect(() => {
    setValue("username", emailAddress || "");
    setValue("display_name", emailAddress || undefined);
  }, [emailAddress, setValue]);

  useEffect(() => {
    const preset = getProviderPreset(providerType);
    if (!preset) return;
    setValue("receive_protocol", preset.receive_protocol);
    setValue("imap_host", preset.imap_host ?? "");
    setValue("imap_port", preset.imap_port ?? undefined);
    setValue("imap_secure", preset.imap_secure);
    setValue("pop3_host", preset.pop3_host ?? "");
    setValue("pop3_port", preset.pop3_port ?? undefined);
    setValue("pop3_secure", preset.pop3_secure);
    setValue("smtp_host", preset.smtp_host);
    setValue("smtp_port", preset.smtp_port);
    setValue("smtp_secure", preset.smtp_secure);
    setValue("smtp_require_starttls", preset.smtp_require_starttls);
  }, [providerType, setValue]);

  const onSubmit = async (values: CreateFormValues | EditFormValues) => {
    const payload = {
      ...values,
      display_name: values.display_name || values.email_address,
      username: values.username || values.email_address,
    };
    debugger;
    if (mode === "create") {
      const res = await createEmailAccount(payload as CreateEmailAccountRequestCompat);
      if (res.success) {
        toast.success("邮箱账号已绑定");
        onSuccess?.();
        return;
      }
      toast.error(res.error.message);
      return;
    }

    const v = payload as EditFormValues;
    const body: Record<string, unknown> = {
      email_address: v.email_address,
      provider_type: v.provider_type,
      receive_protocol: v.receive_protocol,
      imap_host: v.imap_host || null,
      imap_port: v.imap_port ?? null,
      imap_secure: v.imap_secure,
      pop3_host: v.pop3_host || null,
      pop3_port: v.pop3_port ?? null,
      pop3_secure: v.pop3_secure,
      smtp_host: v.smtp_host,
      smtp_port: v.smtp_port,
      smtp_secure: v.smtp_secure,
      smtp_require_starttls: v.smtp_require_starttls,
      username: v.username || v.email_address,
      display_name: v.display_name || v.email_address,
      sync_interval_seconds: v.sync_interval_seconds,
    };
    if (v.password && v.password.length > 0) {
      body.password = v.password;
    }
    const res = await updateEmailAccount(body as never);
    if (res.success) {
      toast.success("账号已更新");
      onSuccess?.();
      return;
    }
    toast.error(res.error.message);
  };

  const onFormError = (errors: Record<string, { message?: string }>) => {
    const entries = Object.entries(errors);
    if (entries.length > 0) {
      const [, first] = entries[0];
      toast.error(first?.message ?? "请检查表单填写是否完整");
    } else {
      toast.error("请检查表单填写是否完整");
    }
    console.log("[email-account-form] validation errors:", errors);
  };

  const passwordLabel = isAppPasswordProvider(providerType)
    ? mode === "create" ? "客户端安全码" : "客户端安全码（留空则不修改）"
    : mode === "create" ? "密码" : "密码（留空则不修改）";

  const appPasswordHint = isAppPasswordProvider(providerType)
    ? getAppPasswordHint(providerType)
    : null;

  return (
    <form onSubmit={handleSubmit(onSubmit, onFormError)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>邮箱服务商</Label>
          <Select
            value={providerType}
            onValueChange={(v) => setValue("provider_type", v as EmailProviderType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择服务商" />
            </SelectTrigger>
            <SelectContent>
              {EMAIL_PROVIDER_TYPES.map((p) => (
                <SelectItem key={p} value={p}>
                  {providerLabel(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>收件协议</Label>
          <Select
            value={receiveProtocol}
            onValueChange={(v) => setValue("receive_protocol", v as EmailReceiveProtocol)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EMAIL_RECEIVE_PROTOCOLS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email_address">邮箱地址</Label>
        <Input
          id="email_address"
          {...register("email_address")}
          disabled={mode === "edit"}
        />
        {formState.errors.email_address && (
          <p className="text-xs text-destructive">
            {formState.errors.email_address.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{passwordLabel}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
        {appPasswordHint && (
          <p className="text-xs text-default-400">{appPasswordHint}</p>
        )}
        {formState.errors.password && (
          <p className="text-xs text-destructive">
            {formState.errors.password.message}
          </p>
        )}
      </div>

      {receiveProtocol === "imap" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="imap_host">IMAP 主机</Label>
            <Input id="imap_host" {...register("imap_host")} />
            {formState.errors.imap_host && (
              <p className="text-xs text-destructive">
                {formState.errors.imap_host.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="imap_port">IMAP 端口</Label>
            <Input id="imap_port" type="number" {...register("imap_port", { valueAsNumber: true })} />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Switch
              checked={!!watch("imap_secure")}
              onCheckedChange={(c) => setValue("imap_secure", c)}
            />
            <Label>IMAP SSL/TLS</Label>
          </div>
        </div>
      )}

      {receiveProtocol === "pop3" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pop3_host">POP3 主机</Label>
            <Input id="pop3_host" {...register("pop3_host")} />
            {formState.errors.pop3_host && (
              <p className="text-xs text-destructive">
                {formState.errors.pop3_host.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pop3_port">POP3 端口</Label>
            <Input id="pop3_port" type="number" {...register("pop3_port", { valueAsNumber: true })} />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Switch
              checked={!!watch("pop3_secure")}
              onCheckedChange={(c) => setValue("pop3_secure", c)}
            />
            <Label>POP3 SSL/TLS</Label>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="smtp_host">SMTP 主机</Label>
          <Input id="smtp_host" {...register("smtp_host")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="smtp_port">SMTP 端口</Label>
          <Input id="smtp_port" type="number" {...register("smtp_port", { valueAsNumber: true })} />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={!!watch("smtp_secure")}
            onCheckedChange={(c) => setValue("smtp_secure", c)}
          />
          <Label>SMTP SSL/TLS</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={!!watch("smtp_require_starttls")}
            onCheckedChange={(c) => setValue("smtp_require_starttls", c)}
          />
          <Label>要求 STARTTLS</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sync_interval_seconds">同步间隔（秒，60-86400）</Label>
        <Input
          id="sync_interval_seconds"
          type="number"
          {...register("sync_interval_seconds", { valueAsNumber: true })}
        />
        {formState.errors.sync_interval_seconds && (
          <p className="text-xs text-destructive">
            {formState.errors.sync_interval_seconds.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={formState.isSubmitting}>
        {formState.isSubmitting
          ? "提交中..."
          : mode === "create"
            ? "绑定邮箱"
            : "保存修改"}
      </Button>
    </form>
  );
}

type CreateEmailAccountRequestCompat = z.infer<typeof emailAccountBaseSchema>;
