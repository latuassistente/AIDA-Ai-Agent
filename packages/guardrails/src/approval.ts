export interface ApprovalRequest {
  id: string;
  tenantId: string;
  goalId: string;
  action: string;
  reason: string;
  requestedBy: string;
  createdAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
}

export interface ApprovalStore {
  create(request: ApprovalRequest): Promise<void>;
  get(id: string): Promise<ApprovalRequest | undefined>;
  update(id: string, status: ApprovalRequest["status"]): Promise<void>;
}

export class InMemoryApprovalStore implements ApprovalStore {
  private readonly requests = new Map<string, ApprovalRequest>();

  async create(request: ApprovalRequest): Promise<void> {
    this.requests.set(request.id, request);
  }

  async get(id: string): Promise<ApprovalRequest | undefined> {
    return this.requests.get(id);
  }

  async update(id: string, status: ApprovalRequest["status"]): Promise<void> {
    const current = this.requests.get(id);
    if (!current) throw new Error(`Approval not found: ${id}`);
    this.requests.set(id, { ...current, status });
  }
}
