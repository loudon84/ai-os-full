import type { DomainEvent } from "./domain-event.js";

type DomainEventHandler = (event: DomainEvent) => void | Promise<void>;

export class EventBus {
  private readonly handlers = new Map<string, DomainEventHandler[]>();

  on(eventName: string, handler: DomainEventHandler): void {
    const list = this.handlers.get(eventName) ?? [];
    list.push(handler);
    this.handlers.set(eventName, list);
  }

  async emit(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.name) ?? [];
    await Promise.all(handlers.map((handler) => handler(event)));
  }
}

export const globalEventBus = new EventBus();
