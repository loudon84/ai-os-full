export interface DomainEvent<TPayload = Record<string, unknown>> {
  name: string;
  workspaceId: string | null;
  payload: TPayload;
  occurredAt: Date;
}

export function createDomainEvent<TPayload extends Record<string, unknown>>(
  name: string,
  workspaceId: string | null,
  payload: TPayload,
): DomainEvent<TPayload> {
  return {
    name,
    workspaceId,
    payload,
    occurredAt: new Date(),
  };
}
