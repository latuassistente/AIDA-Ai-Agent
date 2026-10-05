import type { Evidence } from "../../core/src/contracts";

export interface KnowledgeDocument {
  id: string;
  tenantId: string;
  title: string;
  sourceType: string;
  version: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  status: "ACTIVE" | "SUPERSEDED" | "ARCHIVED";
}

export interface KnowledgeSearchRequest {
  tenantId: string;
  query: string;
  topK?: number;
}

export interface KnowledgeSearchResult {
  document: KnowledgeDocument;
  evidence: Evidence[];
  relevance: number;
}

export interface KnowledgeProvider {
  search(request: KnowledgeSearchRequest): Promise<KnowledgeSearchResult[]>;
}
