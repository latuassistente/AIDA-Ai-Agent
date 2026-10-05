export type ProjectStage =
  | "DISCOVERY"
  | "RESEARCH"
  | "AUDIT"
  | "STRATEGY"
  | "OUTREACH"
  | "QUALIFICATION"
  | "APPOINTMENT"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "SALE"
  | "ONBOARDING"
  | "DELIVERY"
  | "QA"
  | "APPROVAL"
  | "PUBLICATION"
  | "SUPPORT"
  | "OPTIMIZATION";

export interface ProjectBrain {
  projectId: string;
  tenantId: string;
  customerId: string;
  stage: ProjectStage;
  objective: string;
  completed: string[];
  missing: string[];
  blockers: string[];
  deadlines: Array<{ label: string; dueAt: string }>;
  nextAction?: string;
  kpis: Record<string, number>;
  timelineEventIds: string[];
}
