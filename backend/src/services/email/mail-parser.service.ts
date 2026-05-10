import { simpleParser, type AddressObject } from "mailparser";

import type { EmailAddress } from "@portal/shared";

import type {
  FetchedAttachment,
  FetchedMessage,
} from "./providers/mailbox-provider.js";

function toAddresses(value: AddressObject | AddressObject[] | undefined): EmailAddress[] {
  const objects = Array.isArray(value) ? value : value ? [value] : [];
  return objects.flatMap((object) =>
    object.value
      .map((address) => ({
      name: address.name || undefined,
      address: address.address ?? "",
      }))
      .filter((address) => address.address.length > 0),
  );
}

export class MailParserService {
  async parse(
    raw: Buffer,
    params: { uid: string; folderPath: string },
  ): Promise<FetchedMessage> {
    const parsed = await simpleParser(raw);
    const attachments: FetchedAttachment[] = parsed.attachments.map(
      (attachment) => ({
        filename: attachment.filename ?? null,
        contentType: attachment.contentType ?? null,
        size: attachment.size,
        content: attachment.content,
        contentId: attachment.contentId ?? null,
        isInline: attachment.contentDisposition === "inline",
      }),
    );

    return {
      uid: params.uid,
      messageId: parsed.messageId ?? null,
      from: toAddresses(parsed.from)[0] ?? null,
      to: toAddresses(parsed.to),
      cc: toAddresses(parsed.cc),
      bcc: toAddresses(parsed.bcc),
      replyTo: toAddresses(parsed.replyTo),
      subject: parsed.subject ?? null,
      textBody: parsed.text ?? null,
      htmlBody: typeof parsed.html === "string" ? parsed.html : null,
      date: parsed.date ?? null,
      inReplyTo: parsed.inReplyTo ?? null,
      references: Array.isArray(parsed.references)
        ? parsed.references
        : parsed.references
          ? [parsed.references]
          : [],
      attachments,
      flags: [],
      folderPath: params.folderPath,
    };
  }
}
