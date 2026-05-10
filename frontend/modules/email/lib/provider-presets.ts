import type { EmailProviderType, EmailReceiveProtocol } from "@portal/shared";

export interface ProviderPreset {
  imap_host: string | null;
  imap_port: number | null;
  imap_secure: boolean;
  pop3_host: string | null;
  pop3_port: number | null;
  pop3_secure: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_require_starttls: boolean;
  receive_protocol: EmailReceiveProtocol;
}

export function getProviderPreset(provider: EmailProviderType): ProviderPreset | null {
  switch (provider) {
    case "gmail":
      return {
        receive_protocol: "imap",
        imap_host: "imap.gmail.com",
        imap_port: 993,
        imap_secure: true,
        pop3_host: "pop.gmail.com",
        pop3_port: 995,
        pop3_secure: true,
        smtp_host: "smtp.gmail.com",
        smtp_port: 587,
        smtp_secure: true,
        smtp_require_starttls: true,
      };
    case "netease_163":
      return {
        receive_protocol: "imap",
        imap_host: "imap.163.com",
        imap_port: 993,
        imap_secure: true,
        pop3_host: "pop.163.com",
        pop3_port: 995,
        pop3_secure: true,
        smtp_host: "smtp.163.com",
        smtp_port: 465,
        smtp_secure: true,
        smtp_require_starttls: false,
      };
    case "tencent_exmail":
      return {
        receive_protocol: "imap",
        imap_host: "imap.exmail.qq.com",
        imap_port: 993,
        imap_secure: true,
        pop3_host: "pop.exmail.qq.com",
        pop3_port: 995,
        pop3_secure: true,
        smtp_host: "smtp.exmail.qq.com",
        smtp_port: 465,
        smtp_secure: true,
        smtp_require_starttls: false,
      };
    case "aliyun_enterprise":
      return {
        receive_protocol: "imap",
        imap_host: "imap.mxhichina.com",
        imap_port: 993,
        imap_secure: true,
        pop3_host: null,
        pop3_port: null,
        pop3_secure: true,
        smtp_host: "smtp.mxhichina.com",
        smtp_port: 465,
        smtp_secure: true,
        smtp_require_starttls: false,
      };
    case "custom":
    default:
      return null;
  }
}
