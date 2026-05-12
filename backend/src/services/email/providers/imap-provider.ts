import { ImapFlow } from "imapflow";
import { simpleParser, type AddressObject } from "mailparser";

import type { EmailAddress } from "@portal/shared";

import type {
  FetchedAttachment,
  FetchedMessage,
  FolderInfo,
  MailboxProvider,
  ReceiveConfig,
} from "./mailbox-provider.js";

interface ImapListResponse {
  path: string;
  name?: string;
  specialUse?: string;
}

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

const SYNC_FOLDERS = [
  "INBOX", "Sent", "Drafts", "Junk", "Trash", "Archive",
  "已发送", "草稿", "垃圾邮件", "已删除邮件",
];

const MAX_MESSAGES_PER_FOLDER = 500;

export class ImapProvider implements MailboxProvider {
  private client: ImapFlow | null = null;

  async connect(config: ReceiveConfig): Promise<void> {
    this.client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: config.password,
      },
      logger: false as unknown as undefined,
    });
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    if (!this.client) return;
    await this.client.logout();
    this.client = null;
  }

  async listFolders(): Promise<FolderInfo[]> {
    const client = this.requireClient();
    const folders = await client.list();
    return folders.map((folder) => this.toFolderInfo(folder as ImapListResponse));
  }

  async fetchNewMessages(since: Date | null): Promise<FetchedMessage[]> {
    const client = this.requireClient();
    const allMessages: FetchedMessage[] = [];

    const folders = await client.list();
    const folderMeta = folders
      .map((f) => (f as ImapListResponse))
      .filter((f) => {
        if (SYNC_FOLDERS.some((sf) => f.path === sf)) return true;
        const su = f.specialUse?.toLowerCase() ?? "";
        return su.includes("\\inbox") || su.includes("\\sent") || su.includes("\\drafts") || su.includes("\\junk") || su.includes("\\trash") || su.includes("\\archive");
      });

    for (const folder of folderMeta) {
      const messages = await this.fetchFolderMessages(client, folder.path, folder.specialUse ?? null, since);
      allMessages.push(...messages);
      if (allMessages.length >= MAX_MESSAGES_PER_FOLDER * folderMeta.length) break;
    }

    return allMessages;
  }

  async fetchMessageByUid(uid: string): Promise<FetchedMessage | null> {
    const client = this.requireClient();
    const lock = await client.getMailboxLock("INBOX");
    try {
      for await (const message of client.fetch(uid, {
        source: true,
        flags: true,
        uid: true,
      }, { uid: true })) {
        if (!message.source) continue;
        return this.parseMime(message.source, String(message.uid), "INBOX", null, message.flags);
      }
      return null;
    } catch {
      return null;
    } finally {
      lock.release();
    }
  }

  async markAsRead(uids: string[]): Promise<void> {
    if (uids.length === 0) return;
    const client = this.requireClient();
    await client.messageFlagsAdd(uids.join(","), ["\\Seen"], { uid: true });
  }

  async markAsStarred(uids: string[]): Promise<void> {
    if (uids.length === 0) return;
    const client = this.requireClient();
    await client.messageFlagsAdd(uids.join(","), ["\\Flagged"], { uid: true });
  }

  async moveToFolder(uids: string[], targetFolder: string): Promise<void> {
    if (uids.length === 0) return;
    const client = this.requireClient();
    await client.messageMove(uids.join(","), targetFolder, { uid: true });
  }

  async deleteMessages(uids: string[]): Promise<void> {
    if (uids.length === 0) return;
    const client = this.requireClient();
    await client.messageDelete(uids.join(","), { uid: true });
  }

  private async fetchFolderMessages(
    client: ImapFlow,
    folderPath: string,
    folderSpecialUse: string | null,
    since: Date | null,
  ): Promise<FetchedMessage[]> {
    const messages: FetchedMessage[] = [];
    let lock: Awaited<ReturnType<ImapFlow["getMailboxLock"]>> | null = null;

    try {
      lock = await client.getMailboxLock(folderPath);
    } catch {
      return messages;
    }

    try {
      const searchCriteria: Record<string, unknown> = {};
      if (since) {
        searchCriteria.since = since;
      }
      const searchResult = await client.search(searchCriteria);
      const seqNumbers = Array.isArray(searchResult) ? searchResult : [];

      if (seqNumbers.length === 0) return messages;

      const limited = seqNumbers.slice(-MAX_MESSAGES_PER_FOLDER);
      const seqRange = limited.length === 1
        ? String(limited[0])
        : `${limited[0]}:${limited[limited.length - 1]}`;

      let fetchedCount = 0;
      for await (const fetched of client.fetch(seqRange, {
        source: true,
        flags: true,
        uid: true,
      })) {
        try {
          if (!fetched.source) continue;
          const parsed = await this.parseMime(
            fetched.source,
            String(fetched.uid),
            folderPath,
            folderSpecialUse,
            fetched.flags,
          );
          messages.push(parsed);
          fetchedCount++;
          if (fetchedCount >= MAX_MESSAGES_PER_FOLDER) break;
        } catch {
          continue;
        }
      }
    } finally {
      lock.release();
    }

    return messages;
  }

  private async parseMime(
    source: Buffer,
    uid: string,
    folderPath: string,
    folderSpecialUse: string | null,
    flags?: Set<string> | string[],
  ): Promise<FetchedMessage> {
    const parsed = await simpleParser(source);
    const flagArray = flags
      ? Array.from(flags instanceof Set ? flags : new Set(flags))
      : [];

    const attachments: FetchedAttachment[] = (parsed.attachments ?? []).map(
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
      uid,
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
      flags: flagArray,
      folderPath,
      folderSpecialUse,
    };
  }

  private requireClient(): ImapFlow {
    if (!this.client) {
      throw new Error("IMAP client is not connected");
    }
    return this.client;
  }

  private toFolderInfo(folder: ImapListResponse): FolderInfo {
    return {
      name: folder.name ?? folder.path,
      path: folder.path,
      specialUse: folder.specialUse ?? null,
      totalMessages: 0,
      unseenMessages: 0,
    };
  }
}
