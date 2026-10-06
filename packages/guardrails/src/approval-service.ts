import type { ApprovalRequest, ApprovalStore } from "./approval";
import type { AuditSink } from "./audit";

export class ApprovalService {
  constructor(
    private readonly store: ApprovalStore,
    private readonly audit: AuditSink,
    private readonly nextId: () => string,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async request(input: {
    tenantId: string;
    goalId: string;
    action: string;
    reason: string;
    requestedBy: string;
  }): Promise<ApprovalRequest> {
    if (!input.tenantId || !input.goalId || !input.action) {
      throw new Error("tenantId, goalId and action are required.");
    }
    const request: ApprovalRequest = {
      id: this.nextId(),
      ...input,
      createdAt: this.now(),
      status: "PENDING",
    };
    await this.store.create(request);
    await this.audit.append({
      id: this.nextId(),
      tenantId: input.tenantId,
      actor: input.requestedBy,
      action: "approval.request",
      decision: "APPROVAL_REQUIRED",
      createdAt: this.now(),
    });
    return request;
  }

  async decide(input: {
    id: string;
    tenantId: string;
    decidedBy: string;
    status: "APPROVED" | "REJECTED";
  }): Promise<ApprovalRequest> {
    const current = await this.store.get(input.id, input.tenantId);
    if (!current) throw new Error("Approval not found.");
    const result = await this.store.decide({ ...input, decidedAt: this.now() });
    await this.audit.append({
      id: this.nextId(),
      tenantId: input.tenantId,
      actor: input.decidedBy,
      action: "approval.decision",
      decision: input.status === "APPROVED" ? "ALLOWED" : "BLOCKED",
      createdAt: this.now(),
    });
    return result;
  }
}
