import { createDomainEvent } from "./domain-event.js";
import { globalEventBus } from "./event-bus.js";

export async function publishDomainEvent(
  name: string,
  workspaceId: string | null,
  payload: Record<string, unknown>,
): Promise<void> {
  await globalEventBus.emit(createDomainEvent(name, workspaceId, payload));
}
