export type AidaEventType =
  | "GOAL_CREATED"
  | "GOAL_STARTED"
  | "STEP_STARTED"
  | "STEP_COMPLETED"
  | "APPROVAL_REQUESTED"
  | "HUMAN_HANDOFF"
  | "GOAL_COMPLETED"
  | "GOAL_FAILED";

export interface AidaEvent<TPayload = unknown> {
  id: string;
  tenantId: string;
  type: AidaEventType;
  aggregateId: string;
  payload: TPayload;
  occurredAt: string;
}

export interface EventBus {
  publish(event: AidaEvent): Promise<void>;
  subscribe(type: AidaEventType, handler: (event: AidaEvent) => Promise<void>): () => void;
}

export class InMemoryEventBus implements EventBus {
  private readonly handlers = new Map<AidaEventType, Set<(event: AidaEvent) => Promise<void>>>();

  async publish(event: AidaEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? new Set();
    await Promise.all([...handlers].map((handler) => handler(event)));
  }

  subscribe(type: AidaEventType, handler: (event: AidaEvent) => Promise<void>): () => void {
    const handlers = this.handlers.get(type) ?? new Set();
    handlers.add(handler);
    this.handlers.set(type, handlers);
    return () => handlers.delete(handler);
  }
}
