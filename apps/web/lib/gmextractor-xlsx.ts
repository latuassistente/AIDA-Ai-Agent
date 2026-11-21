import { inflateRawSync } from "node:zlib";

function readZipEntries(buffer: Buffer): Map<string, Buffer> {
  const min = Math.max(0, buffer.length - 65557);
  let eocd = -1;
  for (let i = buffer.length - 22; i >= min; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("XLSX_INVALID_ZIP");
  const count = buffer.readUInt16LE(eocd + 10);
  let cursor = buffer.readUInt32LE(eocd + 16);
  const entries = new Map<string, Buffer>();
  for (let i = 0; i < count; i++) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) throw new Error("XLSX_INVALID_DIRECTORY");
    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.toString("utf8", cursor + 46, cursor + 46 + nameLength);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    if (method === 0) entries.set(name, Buffer.from(compressed));
    else if (method === 8) entries.set(name, inflateRawSync(compressed));
    else throw new Error("XLSX_UNSUPPORTED_COMPRESSION");
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}
const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
const columnIndex = (ref: string) => {
  const letters = ref.match(/^[A-Z]+/)?.[0] || "A";
  return [...letters].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
};
export function parseGmExtractorXlsx(buffer: Buffer): Record<string, string>[] {
  const files = readZipEntries(buffer);
  const sheet = files.get("xl/worksheets/sheet1.xml");
  if (!sheet) throw new Error("XLSX_SHEET_NOT_FOUND");
  const shared = files.get("xl/sharedStrings.xml");
  const strings = shared ? [...shared.toString("utf8").matchAll(/<si[\s\S]*?>([\s\S]*?)<\/si>/g)].map(m =>
    [...m[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(t => decode(t[1])).join("")
  ) : [];
  const xml = sheet.toString("utf8");
  const rows = [...xml.matchAll(/<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/g)];
  if (!rows.length) throw new Error("XLSX_EMPTY_SHEET");
  const matrix = rows.map(row => {
    const cells: string[] = [];
    for (const match of row[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const ref = match[1].match(/\br="([^"]+)"/)?.[1];
      if (!ref) continue;
      const index = columnIndex(ref);
      const type = match[1].match(/\bt="([^"]+)"/)?.[1];
      const value = match[2].match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
      const inline = [...match[2].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(x => decode(x[1])).join("");
      cells[index] = type === "s" ? (strings[Number(value)] ?? "") : type === "inlineStr" ? inline : decode(value);
    }
    return cells;
  });
  const headers = (matrix.shift() || []).map(x => x.trim());
  if (!headers.some(x => x.toLowerCase() === "nome")) throw new Error("XLSX_GMEXTRACTOR_HEADERS_NOT_FOUND");
  return matrix.filter(row => row.some(value => !!value?.trim())).map(row =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))
  );
}
