import { inflateRawSync } from "node:zlib";
import type { ImportedEmailRow } from "./recipient-csv";

const MAX_ARCHIVE_ENTRY_BYTES = 20 * 1024 * 1024;
const MAX_ARCHIVE_TOTAL_BYTES = 25 * 1024 * 1024;
const MAX_ARCHIVE_ENTRIES = 1_000;

function decodeXml(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

function xmlTextNodes(xml: string): string {
  return [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)]
    .map((match) => decodeXml(match[1] ?? ""))
    .join("");
}

function zipEntries(buffer: Buffer): Map<string, Buffer> {
  let eocd = -1;
  const min = Math.max(0, buffer.length - 65_557);
  for (let offset = buffer.length - 22; offset >= min; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) { eocd = offset; break; }
  }
  if (eocd < 0) throw new Error("File XLSX non valido: archivio ZIP non trovato.");
  const count = buffer.readUInt16LE(eocd + 10);
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  if (count > MAX_ARCHIVE_ENTRIES) throw new Error("Il file XLSX contiene troppe voci ZIP.");
  const entries = new Map<string, Buffer>();
  let expandedTotal = 0;
  let cursor = centralOffset;
  for (let index = 0; index < count; index += 1) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) throw new Error("Indice ZIP XLSX non valido.");
    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.toString("utf8", cursor + 46, cursor + 46 + nameLength);
    cursor += 46 + nameLength + extraLength + commentLength;
    if (!name.startsWith("xl/") || name.endsWith("/") || uncompressedSize > MAX_ARCHIVE_ENTRY_BYTES) continue;
    if (buffer.readUInt32LE(localOffset) !== 0x04034b50) throw new Error("Contenuto ZIP XLSX non valido.");
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
    let data: Buffer;
    if (method === 0) data = Buffer.from(compressed);
    else if (method === 8) data = inflateRawSync(compressed, { maxOutputLength: MAX_ARCHIVE_ENTRY_BYTES });
    else continue;
    if (data.length !== uncompressedSize) throw new Error("Dimensione contenuto XLSX non coerente.");
    expandedTotal += data.length;
    if (expandedTotal > MAX_ARCHIVE_TOTAL_BYTES) throw new Error("Il contenuto XLSX supera il limite di sicurezza.");
    entries.set(name, data);
  }
  return entries;
}

function columnIndex(reference: string): number {
  const letters = reference.replace(/\d/g, "");
  let index = 0;
  for (const char of letters) index = index * 26 + char.charCodeAt(0) - 64;
  return index - 1;
}

function parseSheetRows(xml: string, shared: string[]): string[][] {
  const rows: string[][] = [];
  for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: string[] = [];
    for (const cellMatch of (rowMatch[1] ?? "").matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1] ?? "";
      const body = cellMatch[2] ?? "";
      const ref = attrs.match(/\br="([A-Z]+\d+)"/)?.[1];
      if (!ref) continue;
      const type = attrs.match(/\bt="([^"]+)"/)?.[1];
      const value = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      let text = "";
      if (type === "s" && value !== undefined) text = shared[Number(value)] ?? "";
      else if (type === "inlineStr") text = xmlTextNodes(body);
      else if (value !== undefined) text = decodeXml(value);
      cells[columnIndex(ref)] = text.trim();
    }
    rows.push(cells);
  }
  return rows;
}

export function parseRecipientXlsx(input: Uint8Array): ImportedEmailRow[] {
  const entries = zipEntries(Buffer.from(input));
  const worksheetName = [...entries.keys()].find((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name));
  if (!worksheetName) throw new Error("Il file XLSX non contiene un foglio di lavoro leggibile.");
  const sharedXml = entries.get("xl/sharedStrings.xml")?.toString("utf8") ?? "";
  const shared = [...sharedXml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)]
    .map((match) => xmlTextNodes(match[1] ?? ""));
  const sheetXml = entries.get(worksheetName)!.toString("utf8");
  const rows = parseSheetRows(sheetXml, shared).filter((row) => row.some((cell) => cell?.trim()));
  if (rows.length < 2) throw new Error("Il foglio XLSX deve contenere intestazioni e almeno un destinatario.");
  const headers = rows[0]!.map((header) => (header ?? "").trim().toLowerCase());
  const find = (...names: string[]) => headers.findIndex((header) => names.includes(header));
  const emailIndex = find("email", "e-mail", "indirizzo email");
  if (emailIndex < 0) throw new Error("Colonna obbligatoria mancante: email.");
  const get = (values: string[], index: number) => index >= 0 ? values[index]?.trim() ?? "" : "";
  return rows.slice(1).map((values) => {
    const legalValue = get(values, find("legalreview", "stato autorizzazione")).toLowerCase();
    const legalReview: ImportedEmailRow["legalReview"] =
      legalValue === "approved" || legalValue === "approvato" ? "approved" :
      legalValue === "rejected" || legalValue === "rifiutato" ? "rejected" : "pending";
    const companyName = get(values, find("companyname", "azienda", "ragione sociale"));
    const contactName = get(values, find("contactname", "referente", "nome contatto"));
    const legalBasis = get(values, find("legalbasis", "base giuridica"));
    const authorizationEvidenceId = get(values, find("authorizationevidenceid", "prova autorizzazione", "id autorizzazione"));
    return {
      email: get(values, emailIndex),
      ...(companyName ? { companyName } : {}),
      ...(contactName ? { contactName } : {}),
      ...(legalBasis ? { legalBasis } : {}),
      ...(authorizationEvidenceId ? { authorizationEvidenceId } : {}),
      legalReview,
      suppressed: ["1", "true", "si", "sì", "yes"].includes(get(values, find("suppressed", "soppresso")).toLowerCase()),
      unsubscribed: ["1", "true", "si", "sì", "yes"].includes(get(values, find("unsubscribed", "disiscritto")).toLowerCase()),
    };
  }).filter((row) => row.email.length > 0);
}
