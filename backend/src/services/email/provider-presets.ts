import type { EmailProviderType } from "@portal/shared";

export interface ProviderPreset {
  key: EmailProviderType;
  label: string;
  imap: { host: string; port: number; secure: boolean };
  pop3: { host: string; port: number; secure: boolean };
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    requireStartTls?: boolean;
  };
  authHint: string;
}

export const EMAIL_PROVIDER_PRESETS: Record<EmailProviderType, ProviderPreset> = {
  gmail: {
    key: "gmail",
    label: "Gmail",
    imap: { host: "imap.gmail.com", port: 993, secure: true },
    pop3: { host: "pop.gmail.com", port: 995, secure: true },
    smtp: {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireStartTls: true,
    },
    authHint: "Use a Google App Password generated from your account security settings.",
  },
  netease_163: {
    key: "netease_163",
    label: "163 邮箱",
    imap: { host: "imap.163.com", port: 993, secure: true },
    pop3: { host: "pop.163.com", port: 995, secure: true },
    smtp: { host: "smtp.163.com", port: 465, secure: true },
    authHint: "Use the authorization code generated after enabling IMAP/SMTP in 163 Mail.",
  },
  aliyun_enterprise: {
    key: "aliyun_enterprise",
    label: "阿里企业邮箱",
    imap: { host: "imap.qiye.aliyun.com", port: 993, secure: true },
    pop3: { host: "pop.qiye.aliyun.com", port: 995, secure: true },
    smtp: { host: "smtp.qiye.aliyun.com", port: 465, secure: true },
    authHint: "Use the mailbox password after the administrator enables IMAP/POP3 access.",
  },
  tencent_exmail: {
    key: "tencent_exmail",
    label: "腾讯企业邮箱",
    imap: { host: "imap.exmail.qq.com", port: 993, secure: true },
    pop3: { host: "pop.exmail.qq.com", port: 995, secure: true },
    smtp: { host: "smtp.exmail.qq.com", port: 465, secure: true },
    authHint: "Use the client-specific password generated in Tencent Exmail security settings.",
  },
  custom: {
    key: "custom",
    label: "自定义",
    imap: { host: "", port: 993, secure: true },
    pop3: { host: "", port: 995, secure: true },
    smtp: { host: "", port: 465, secure: true },
    authHint: "Use the credential required by your email provider.",
  },
};

export function getProviderPreset(provider: EmailProviderType): ProviderPreset {
  return EMAIL_PROVIDER_PRESETS[provider];
}
