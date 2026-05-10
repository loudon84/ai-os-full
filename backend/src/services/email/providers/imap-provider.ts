import { ImapFlow } from "imapflow";

import type {
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

  async fetchNewMessages(_since: Date | null): Promise<FetchedMessage[]> {
    // Full MIME parsing is handled by EmailSyncService in a later integration slice.
    return [];
  }

  async fetchMessageByUid(_uid: string): Promise<FetchedMessage | null> {
    return null;
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
