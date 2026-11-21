import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";
import { prisma } from "../../../../lib/prisma";
import { getVerifiedAidaSession } from "../../../../lib/verified-session";
import { normalizeLead } from "../../../../lib/lead-extractor-normalize";
import { parseGmExtractorXlsx } from "../../../../lib/gmextractor-xlsx";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  const session = await getVerifiedAidaSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Caricamento non valido." }, { status: 400 }); }
  const file = form.get("file");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".xlsx")) return NextResponse.json({ error: "Selezionare un file Excel .xlsx esportato da GMExtractor." }, { status: 400 });
  if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: "Il file supera il limite di 15 MB." }, { status: 413 });
  let rows: Record<string, string>[];
  try { rows = parseGmExtractorXlsx(Buffer.from(await file.arrayBuffer())); }
  catch (error) {
    const code = error instanceof Error ? error.message : "";
    const messages: Record<string, string> = { XLSX_INVALID_ZIP: "File Excel non valido.", XLSX_INVALID_DIRECTORY: "Struttura Excel non valida.", XLSX_UNSUPPORTED_COMPRESSION: "Compressione Excel non supportata.", XLSX_SHEET_NOT_FOUND: "Foglio dati non trovato.", XLSX_EMPTY_SHEET: "Il foglio Excel è vuoto.", XLSX_GMEXTRACTOR_HEADERS_NOT_FOUND: "Le intestazioni non corrispondono all'esportazione GMExtractor." };
    return NextResponse.json({ error: messages[code] || "Impossibile leggere il file Excel." }, { status: 422 });
  }
  const retrievedAt = new Date().toISOString();
  const normalized = rows.map(row => normalizeLead(row, "google_maps", retrievedAt)).filter(row => row.companyName || row.mobilePhone || row.landlinePhone || row.email);
  if (!normalized.length) return NextResponse.json({ error: "Il file non contiene schede aziendali utilizzabili." }, { status: 422 });
  const data = normalized.map(row => {
    const { socialProfiles, ...lead } = row;
    const stableIdentity = row.mobilePhone || row.landlinePhone || row.email || row.sourceUrl || row.companyName || JSON.stringify(row.sourceFields);
    const sourceKey = createHash("sha256").update("google_maps|gmextractor|"+stableIdentity.toLowerCase()).digest("hex");
    return { ...lead, sourceKey, tenantId: session.tenantId, sourceFields: row.sourceFields as Prisma.InputJsonObject, fieldProvenance: row.fieldProvenance as Prisma.InputJsonObject, ...(socialProfiles ? { socialProfiles: socialProfiles as Prisma.InputJsonObject } : {}) };
  });
  const result = await prisma.b2BLead.createMany({ data, skipDuplicates: true });
  await prisma.auditLog.create({ data: { tenantId: session.tenantId, actor: session.sub, action: "B2B_LEADS_GMEXTRACTOR_IMPORT", decision: "ALLOW", details: { fileName: file.name.slice(0, 180), rowsRead: rows.length, validRows: normalized.length, imported: result.count, duplicates: normalized.length - result.count, source: "GMExtractor XLSX export" } } });
  return NextResponse.json({ source: "google_maps", rowsRead: rows.length, valid: normalized.length, imported: result.count, duplicates: normalized.length - result.count });
}
