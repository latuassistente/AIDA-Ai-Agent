export interface PriceRule {
  id: string;
  tenantId: string;
  productOrServiceId: string;
  currency: string;
  amount: number;
  validFrom: string;
  validUntil?: string;
  requiresApproval: boolean;
  evidenceId: string;
}

export interface Proposal {
  id: string;
  tenantId: string;
  customerId: string;
  projectId: string;
  items: Array<{ productOrServiceId: string; quantity: number; unitPrice: number }>;
  currency: string;
  total: number;
  status: "DRAFT" | "PENDING_APPROVAL" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  sourceEvidenceIds: string[];
}
