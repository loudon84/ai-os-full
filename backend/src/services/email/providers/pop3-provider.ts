import type {
  FetchedMessage,
  FolderInfo,
  MailboxProvider,
  ReceiveConfig,
} from "./mailbox-provider.js";

export class Pop3Provider implements MailboxProvider {
  private connected = false;

  async connect(_config: ReceiveConfig): Promise<void> {
    // POP3 protocol support is wired behind the MailboxProvider interface.
    // The full UIDL/RETR implementation belongs with the sync integration slice.
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async listFolders(): Promise<FolderInfo[]> {
    this.requireConnected();
    return [
      {
        name: "INBOX",
        path: "INBOX",
        specialUse: "\\Inbox",
        totalMessages: 0,
        unseenMessages: 0,
      },
    ];
  }

  async fetchNewMessages(_since: Date | null): Promise<FetchedMessage[]> {
    this.requireConnected();
    return [];
  }

  async fetchMessageByUid(_uid: string): Promise<FetchedMessage | null> {
    this.requireConnected();
    return null;
  }

  async markAsRead(_uids: string[]): Promise<void> {
    this.requireConnected();
  }

  async markAsStarred(_uids: string[]): Promise<void> {
    this.requireConnected();
  }

  async moveToFolder(_uids: string[], _targetFolder: string): Promise<void> {
    this.requireConnected();
  }

  async deleteMessages(_uids: string[]): Promise<void> {
    this.requireConnected();
  }

  private requireConnected(): void {
    if (!this.connected) {
      throw new Error("POP3 provider is not connected");
    }
  }
}
