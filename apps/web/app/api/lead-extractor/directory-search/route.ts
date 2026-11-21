import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";
import { getVerifiedAidaSession } from "../../../../lib/verified-session";
import { normalizeLead, type LeadSource, type SourceRow } from "../../../../lib/lead-extractor-normalize";
import { searchItalianDirectory, type ItalianDirectory } from "../../../../lib/italian-directory-open-source";

const list = (v: unknown) => Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!x.trim()).map(x => x.trim()).slice(0, 20) : [];

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  const session = await getVerifiedAidaSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  let input: Record<string, unknown>;
  try { input = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "JSON non valido." }, { status: 400 }); }

  const directories = list(input.sources).filter((x): x is ItalianDirectory => x === "pagine_gialle" || x === "pagine_bianche");
  const categories = list(input.categories);
  const locations = list(input.locations);
  const limit = Math.min(100, Math.max(1, Number(input.maxRecords) || 50));
  const userAgent = process.env.DIRECTORY_SCRAPER_USER_AGENT;
  if (!directories.length || !categories.length || !locations.length) return NextResponse.json({ error: "Selezionare almeno una fonte, categoria e località." }, { status: 400 });
  if (!userAgent) return NextResponse.json({ error: "DIRECTORY_SCRAPER_USER_AGENT non configurato." }, { status: 503 });

  const templates: Record<ItalianDirectory, string | undefined> = {
    pagine_gialle: process.env.PAGINE_GIALLE_SEARCH_URL_TEMPLATE,
    pagine_bianche: process.env.PAGINE_BIANCHE_SEARCH_URL_TEMPLATE,
  };
  const missing = directories.filter(source => !templates[source]);
  if (missing.length) return NextResponse.json({ error: "URL di ricerca non ancora verificati e configurati per: " + missing.join(", "), status: "configurable" }, { status: 503 });

  const retrievedAt = new Date().toISOString();
  const rows: Array<{ source: LeadSource; row: SourceRow }> = [];
  try {
    for (const directory of directories) {
      const template = templates[directory]!;
      for (const category of categories) {
        for (const location of locations) {
          if (rows.length >= limit) break;
          const searchUrl = template.replaceAll("{category}", encodeURIComponent(category)).replaceAll("{location}", encodeURIComponent(location));
          const batch = await searchItalianDirectory({ directory, category, location, searchUrl, userAgent, maxPages: 5 });
          for (const row of batch) {
            rows.push({ source: directory, row });
            if (rows.length >= limit) break;
          }
        }
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "DIRECTORY_EXTRACTION_ERROR";
    const status = message.includes("ROBOTS") ? 403 : 502;
    return NextResponse.json({ error: "Estrazione interrotta: " + message, imported: 0 }, { status });
  }

  const normalized = rows.map(({ source, row }) => normalizeLead(row, source, retrievedAt));
  if (!normalized.length) return NextResponse.json({ error: "Nessun dato strutturato accessibile trovato nelle pagine consultate.", received: 0, imported: 0 }, { status: 422 });
  const result = await prisma.b2BLead.createMany({
    data: normalized.map(record => {
      const { socialProfiles, ...leadData } = record;
      return {
        ...leadData,
        tenantId: session.tenantId,
        sourceFields: record.sourceFields as Prisma.InputJsonObject,
        fieldProvenance: record.fieldProvenance as Prisma.InputJsonObject,
        ...(socialProfiles ? { socialProfiles: socialProfiles as Prisma.InputJsonObject } : {}),
      };
    }),
    skipDuplicates: true,
  });
  await prisma.auditLog.create({
    data: {
      tenantId: session.tenantId,
      actor: session.sub,
      action: "B2B_DIRECTORY_OPEN_SOURCE_IMPORT",
      decision: "ALLOW",
      details: { sources: directories, categories, locations, received: normalized.length, inserted: result.count, duplicates: normalized.length - result.count, method: "robots-aware-jsonld" },
    },
  });
  return NextResponse.json({ sources: directories, received: normalized.length, imported: result.count, duplicates: normalized.length - result.count, sent: false, completeness: "structured-data-only" });
}
