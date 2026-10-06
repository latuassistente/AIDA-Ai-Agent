import type { KnowledgeProvider, KnowledgeSearchRequest, KnowledgeSearchResult } from "./contracts";

export class InMemoryKnowledgeProvider implements KnowledgeProvider {
  constructor(private readonly documents: KnowledgeSearchResult[] = []) {}

  async search(request: KnowledgeSearchRequest): Promise<KnowledgeSearchResult[]> {
    const query = request.query.trim().toLocaleLowerCase();
    if (!query) return [];
    return this.documents
      .filter((item) =>
        item.document.tenantId === request.tenantId &&
        item.document.status === "ACTIVE" &&
        (item.document.title.toLocaleLowerCase().includes(query) ||
          item.evidence.some((evidence) => evidence.excerpt?.toLocaleLowerCase().includes(query))),
      )
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, Math.max(1, request.topK ?? 10));
  }
}
