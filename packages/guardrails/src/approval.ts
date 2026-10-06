export interface ApprovalRequest {
  id: string;
  tenantId: string;
  goalId: string;
  action: string;
  reason: string;
  requestedBy: string;
  createdAt: string;
  expiresAt?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  decidedBy?: string;
  decidedAt?: string;
}

export interface ApprovalStore {
  create(request: ApprovalRequest): Promise<void>;
  get(id: string, tenantId: string): Promise<ApprovalRequest | undefined>;
  decide(input: {
    id: string;
    tenantId: string;
    decidedBy: string;
    status: "APPROVED" | "REJECTED";
    decidedAt: string;
  }): Promise<ApprovalRequest>;
}

export class InMemoryApprovalStore implements ApprovalStore {
  private readonly requests = new Map<string, ApprovalRequest>();

  async create(request: ApprovalRequest): Promise<void> {
    if (this.requests.has(request.id)) throw new Error("Approval ID already exists.");
    this.requests.set(request.id, { ...request });
  }

  async get(id: string, tenantId: string): Promise<ApprovalRequest | undefined> {
    const request = this.requests.get(id);
    return request?.tenantId === tenantId ? { ...request } : undefined;
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
      const expired = { ...current, status: "EXPIRED" as const };
      this.requests.set(input.id, expired);
      throw new Error("Approval has expired.");
    }
    const updated: ApprovalRequest = {
      ...current,
      status: input.status,
      decidedBy: input.decidedBy,
      decidedAt: input.decidedAt,
    };
    this.requests.set(input.id, updated);
    return { ...updated };
  }
}
