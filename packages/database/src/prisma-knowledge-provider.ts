import type { PrismaClient } from "@prisma/client";
import type { Evidence } from "../../core/src/contracts";
import type { KnowledgeProvider, KnowledgeSearchRequest, KnowledgeSearchResult } from "../../knowledge/src/contracts";

export class PrismaKnowledgeProvider implements KnowledgeProvider {
  constructor(private readonly db: PrismaClient) {}

  async search(request: KnowledgeSearchRequest): Promise<KnowledgeSearchResult[]> {
    const query = request.query.trim();
    if (!query) return [];

    const rows = await this.db.knowledgeDocument.findMany({
      where: {
        tenantId: request.tenantId,
        status: "ACTIVE",
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { chunks: { some: { content: { contains: query, mode: "insensitive" } } } },
        ],
      },
      include: { chunks: { where: { content: { contains: query, mode: "insensitive" } } } },
      take: Math.max(1, Math.min(request.topK ?? 10, 50)),
      orderBy: { createdAt: "desc" },
    });

    return rows.map((row) => {
      const evidence: Evidence[] = row.chunks.map((chunk) => ({
        id: chunk.id,
        sourceType: row.sourceType,
        sourceId: row.sourceRef,
        sourceVersion: row.version,
        excerpt: chunk.content.slice(0, 1200),
        ...(row.effectiveFrom ? { validFrom: row.effectiveFrom.toISOString() } : {}),
        ...(row.effectiveUntil ? { validUntil: row.effectiveUntil.toISOString() } : {}),
      }));
      const titleMatch = row.title.toLocaleLowerCase().includes(query.toLocaleLowerCase());
      return {
        document: {
          id: row.id,
          tenantId: row.tenantId,
          title: row.title,
          sourceType: row.sourceType,
          version: row.version,
          status: row.status as "ACTIVE" | "SUPERSEDED" | "ARCHIVED",
          ...(row.effectiveFrom ? { effectiveFrom: row.effectiveFrom.toISOString() } : {}),
          ...(row.effectiveUntil ? { effectiveUntil: row.effectiveUntil.toISOString() } : {}),
        },
        evidence,
        relevance: (titleMatch ? 2 : 0) + evidence.length,
      };
    }).sort((a, b) => b.relevance - a.relevance);
  }
}
