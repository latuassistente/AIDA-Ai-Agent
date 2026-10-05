export type FactoryOutput = "WEBSITE" | "WEB_3D" | "SOFTWARE" | "AUTOMATION";

export interface ProductionRequest {
  tenantId: string;
  projectId: string;
  output: FactoryOutput;
  objective: string;
  requirements: string[];
  constraints: string[];
}

export interface ProductionResult {
  ok: boolean;
  previewUrl?: string;
  artifactId?: string;
  validationReportId?: string;
  errors?: string[];
}
