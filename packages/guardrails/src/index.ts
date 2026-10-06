import type { RiskLevel } from "../../core/src/contracts";

export interface ActionRequest {
  tenantId: string;
  actor: string;
  action: string;
  target?: string;
  payload: unknown;
  riskLevel: RiskLevel;
}

export interface PolicyDecision {
  allowed: boolean;
  requiresApproval: boolean;
  requiresHuman: boolean;
  reasons: string[];
}

export interface AuditEvent {
  id: string;
  tenantId: string;
  actor: string;
  action: string;
  decision: "ALLOWED" | "BLOCKED" | "APPROVAL_REQUIRED" | "HUMAN_HANDOFF";
  createdAt: string;
}

export * from "./policy";
export * from "./audit";
export * from "./approval-service";
