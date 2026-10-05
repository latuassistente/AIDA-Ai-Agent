import type { AuditEvent } from "./index";

export interface AuditSink {
  append(event: AuditEvent): Promise<void>;
}

export class InMemoryAuditSink implements AuditSink {
  readonly events: AuditEvent[] = [];

  async append(event: AuditEvent): Promise<void> {
    this.events.push(Object.freeze({ ...event }));
  }
}
