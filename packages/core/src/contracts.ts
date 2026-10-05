export type RiskLevel = "GREEN" | "YELLOW" | "RED";

export type GoalStatus =
  | "DRAFT"
  | "PLANNED"
  | "RUNNING"
  | "WAITING_APPROVAL"
  | "WAITING_HUMAN"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface Goal {
  id: string;
  tenantId: string;
  objective: string;
  successCriteria: string[];
  constraints: string[];
  deadline?: string;
  status: GoalStatus;
  riskLevel: RiskLevel;
  nextAction?: string;
}

export interface Evidence {
  id: string;
  sourceType: string;
  sourceId: string;
  sourceVersion?: string;
  excerpt?: string;
  validFrom?: string;
  validUntil?: string;
}

export interface AgentResult<T = unknown> {
  ok: boolean;
  data?: T;
  evidence?: Evidence[];
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  requiresHuman: boolean;
  nextAction?: string;
  errors?: string[];
}

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  riskLevel: RiskLevel;
}
