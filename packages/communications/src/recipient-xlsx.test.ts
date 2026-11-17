import { describe, expect, it } from "vitest";
import { parseRecipientXlsx } from "./recipient-xlsx";

function makeStoredZip(entries: Record<string, string>): Uint8Array {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(entries)) {
    const nameBytes = Buffer.from(name);
    const data = Buffer.from(text);
    const local = Buffer.alloc(30 + nameBytes.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(0, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);
    nameBytes.copy(local, 30);
    localParts.push(local, data);

    const central = Buffer.alloc(46 + nameBytes.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(0, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt32LE(offset, 42);
    nameBytes.copy(central, 46);
    centralParts.push(central);
    offset += local.length + data.length;
  }
  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(entries).length, 8);
  end.writeUInt16LE(Object.keys(entries).length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, centralDirectory, end]);
}

describe("recipient XLSX parser", () => {
  it("reads email, company and authorization fields from the first worksheet", () => {
    const cell = (ref: string, value: string) => `<c r="${ref}" t="inlineStr"><is><t>${value}</t></is></c>`;
    const worksheet = `<?xml version="1.0"?><worksheet><sheetData><row r="1">${cell("A1", "email")}${cell("B1", "azienda")}${cell("C1", "stato autorizzazione")}</row><row r="2">${cell("A2", "info@example.it")}${cell("B2", "Alfa Srl")}${cell("C2", "approvato")}</row></sheetData></worksheet>`;
    const file = makeStoredZip({ "xl/worksheets/sheet1.xml": worksheet });
    const rows = parseRecipientXlsx(file);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ email: "info@example.it", companyName: "Alfa Srl", legalReview: "pending" });
  });

  it("rejects data that is not an XLSX ZIP archive", () => {
    expect(() => parseRecipientXlsx(Buffer.from("not-an-xlsx"))).toThrow("archivio ZIP non trovato");
  });

  it("reads shared-string cells used by standard spreadsheet exports", () => {
    const shared = "<sst><si><t>email</t></si><si><t>info@example.it</t></si></sst>";
    const worksheet = '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c></row><row r="2"><c r="A2" t="s"><v>1</v></c></row></sheetData></worksheet>';
    const file = makeStoredZip({ "xl/sharedStrings.xml": shared, "xl/worksheets/sheet1.xml": worksheet });
    expect(parseRecipientXlsx(file)[0]?.email).toBe("info@example.it");
  });
});
