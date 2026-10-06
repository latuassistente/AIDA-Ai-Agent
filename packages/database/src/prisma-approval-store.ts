import type { PrismaClient } from "@prisma/client";
import type { ApprovalRequest, ApprovalStore } from "../../guardrails/src/approval";

type DbApproval = {
  id: string;
  tenantId: string;
  goalId: string;
  action: string;
  reason: string;
  requestedBy: string;
  createdAt: Date;
  expiresAt: Date | null;
  status: string;
  decidedBy: string | null;
  decidedAt: Date | null;
};

function toDomain(row: DbApproval): ApprovalRequest {
  return {
    id: row.id,
    tenantId: row.tenantId,
    goalId: row.goalId,
    action: row.action,
    reason: row.reason,
    requestedBy: row.requestedBy,
    createdAt: row.createdAt.toISOString(),
    status: row.status as ApprovalRequest["status"],
    ...(row.expiresAt ? { expiresAt: row.expiresAt.toISOString() } : {}),
    ...(row.decidedBy ? { decidedBy: row.decidedBy } : {}),
    ...(row.decidedAt ? { decidedAt: row.decidedAt.toISOString() } : {}),
  };
}

export class PrismaApprovalStore implements ApprovalStore {
  constructor(private readonly db: PrismaClient) {}

  async create(request: ApprovalRequest): Promise<void> {
    await this.db.approvalRequest.create({
      data: {
        id: request.id,
        tenantId: request.tenantId,
        goalId: request.goalId,
        action: request.action,
        reason: request.reason,
        requestedBy: request.requestedBy,
        createdAt: new Date(request.createdAt),
        expiresAt: request.expiresAt ? new Date(request.expiresAt) : null,
        status: request.status,
      },
    });
  }

  async get(id: string, tenantId: string): Promise<ApprovalRequest | undefined> {
    const row = await this.db.approvalRequest.findFirst({ where: { id, tenantId } });
    return row ? toDomain(row) : undefined;
  }

  async decide(input: {
    id: string;
    tenantId: string;
    decidedBy: string;
    status: "APPROVED" | "REJECTED";
    decidedAt: string;
  }): Promise<ApprovalRequest> {
    const current = await this.get(input.id, input.tenantId);
    if (!current) throw new Error("Approval not found.");
    if (current.status !== "PENDING") throw new Error("Approval is already decided.");
    if (current.expiresAt && Date.parse(current.expiresAt) < Date.parse(input.decidedAt)) {
      await this.db.approvalRequest.updateMany({
        where: { id: input.id, tenantId: input.tenantId, status: "PENDING" },
        data: { status: "EXPIRED" },
      });
      throw new Error("Approval has expired.");
    }

    const updated = await this.db.approvalRequest.updateMany({
      where: { id: input.id, tenantId: input.tenantId, status: "PENDING" },
      data: {
        status: input.status,
        decidedBy: input.decidedBy,
        decidedAt: new Date(input.decidedAt),
      },
    });
    if (updated.count !== 1) throw new Error("Approval was concurrently changed.");
    const row = await this.db.approvalRequest.findFirst({ where: { id: input.id, tenantId: input.tenantId } });
    if (!row) throw new Error("Approval not found after decision.");
    return toDomain(row);
  }
}
