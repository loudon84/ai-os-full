import nodemailer from "nodemailer";

import type { EmailAddress, SendEmailInput } from "@portal/shared";

import { EmailSendFailedError } from "./errors.js";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  requireStartTls: boolean;
  username: string;
  password: string;
}

export interface SendMailParams {
  config: SmtpConfig;
  from: EmailAddress;
  payload: SendEmailInput;
}

function formatAddress(address: EmailAddress): string {
  return address.name ? `${address.name} <${address.address}>` : address.address;
}

function formatAddresses(addresses: EmailAddress[] | undefined): string | undefined {
  if (!addresses || addresses.length === 0) return undefined;
  return addresses.map(formatAddress).join(", ");
}

export class SmtpSenderService {
  async testConnection(config: SmtpConfig): Promise<void> {
    const transport = this.createTransport(config);
    try {
      await transport.verify();
    } finally {
      transport.close();
    }
  }

  async send(params: SendMailParams): Promise<{ messageId: string }> {
    const transport = this.createTransport(params.config);
    try {
      const info = await transport.sendMail({
        from: formatAddress(params.from),
        to: formatAddresses(params.payload.to),
        cc: formatAddresses(params.payload.cc),
        bcc: formatAddresses(params.payload.bcc),
        subject: params.payload.subject,
        html: params.payload.body_html,
        text: params.payload.body_text ?? undefined,
        inReplyTo: params.payload.in_reply_to ?? undefined,
        references: params.payload.references,
      });
      return { messageId: info.messageId };
    } catch (err) {
      const message = err instanceof Error ? err.message : "SMTP send failed";
      throw new EmailSendFailedError(message);
    } finally {
      transport.close();
    }
  }

  private createTransport(config: SmtpConfig) {
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      requireTLS: config.requireStartTls,
      auth: {
        user: config.username,
        pass: config.password,
      },
    });
  }
}
