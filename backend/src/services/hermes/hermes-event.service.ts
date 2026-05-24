import type { HermesRunEventDto } from "@portal/shared";

import type { Db } from "@portal/db";

import { HermesRepository } from "./hermes.repository.js";

function toEventDto(event: {
  id: string;
  runId: string;
  workspaceId: string;
  seq: number;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}): HermesRunEventDto {
  return {
    event_id: event.id,
    run_id: event.runId,
    workspace_id: event.workspaceId,
    seq: event.seq,
    event_type: event.eventType,
    payload: event.payload,
    created_at: event.createdAt.toISOString(),
  };
}

export class HermesEventService {
  private readonly repo = new HermesRepository();

  async appendEvent(
    db: Db,
    input: {
      runId: string;
      workspaceId: string;
      eventType: string;
      payload?: Record<string, unknown>;
    },
  ): Promise<HermesRunEventDto> {
    const maxSeq = await this.repo.getMaxEventSeq(db, input.runId);
    const row = await this.repo.appendRunEvent(db, {
      runId: input.runId,
      workspaceId: input.workspaceId,
      seq: maxSeq + 1,
      eventType: input.eventType,
      payload: input.payload ?? {},
    });
    return toEventDto(row);
  }

  async listEvents(
    db: Db,
    runId: string,
    workspaceId: string,
    afterSeq: number,
    limit: number,
  ): Promise<HermesRunEventDto[]> {
    const rows = await this.repo.listRunEvents(db, runId, workspaceId, afterSeq, limit);
    return rows.map(toEventDto);
  }

  formatSseEvent(event: HermesRunEventDto): string {
    return `data: ${JSON.stringify(event)}\n\n`;
  }

  isTerminalEvent(eventType: string): boolean {
    return (
      eventType === "run.succeeded" ||
      eventType === "run.failed" ||
      eventType === "run.cancelled" ||
      eventType === "stream.end"
    );
  }
}
