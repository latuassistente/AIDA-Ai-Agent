import type { PrismaClient } from "@prisma/client";
import type { AuditEvent } from "../../guardrails/src/index";
import type { AuditSink } from "../../guardrails/src/audit";

export class PrismaAuditSink implements AuditSink {
  constructor(private readonly db: PrismaClient) {}

  async append(event: AuditEvent): Promise<void> {
    await this.db.auditLog.create({
      data: {
        id: event.id,
        tenantId: event.tenantId,
        actor: event.actor,
        action: event.action,
        decision: event.decision,
        createdAt: new Date(event.createdAt),
        details: { source: "aida-runtime" },
      },
    });
  }
}
