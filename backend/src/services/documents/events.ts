import type { Db } from "@portal/db";

import type { DocumentRepository } from "./repository.js";

type Tx = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

export class EventService {
  constructor(private readonly repo: DocumentRepository) {}

  async emit(
    db: Tx,
    params: {
      documentId: string;
      eventType: string;
      actorId: string;
      versionNo?: number | null;
      payload?: Record<string, unknown> | null;
    },
  ): Promise<void> {
    await this.repo.createEvent(db, params);
  }
}
