export interface ImportedEmailRow {
  email: string;
  companyName?: string;
  contactName?: string;
  legalBasis?: string;
  authorizationEvidenceId?: string;
  legalReview: "approved" | "pending" | "rejected";
  suppressed: boolean;
  unsubscribed: boolean;
}

function parseCsvRecords(csv: string, delimiter: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index]!;
    if (char === '"') {
      if (quoted && csv[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      record.push(value.trim());
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && csv[index + 1] === "\n") index += 1;
      record.push(value.trim());
      if (record.some((cell) => cell.length > 0)) records.push(record);
      record = [];
      value = "";
    } else value += char;
  }
  if (quoted) throw new Error("CSV non valido: virgolette non bilanciate.");
  record.push(value.trim());
  if (record.some((cell) => cell.length > 0)) records.push(record);
  return records;
}

export function parseRecipientCsv(csv: string): ImportedEmailRow[] {
  const normalized = csv.replace(/^\uFEFF/, "");
  const firstLine = normalized.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const records = parseCsvRecords(normalized, delimiter);
  if (records.length < 2) throw new Error("Il CSV deve contenere intestazioni e almeno un destinatario.");
  const headers = records[0]!.map((header) => header.trim().toLowerCase());
  const emailIndex = headers.findIndex((header) => ["email", "e-mail", "indirizzo email"].includes(header));
  if (emailIndex < 0) throw new Error("Colonna obbligatoria mancante: email.");
  const find = (...names: string[]) => headers.findIndex((header) => names.includes(header));
  const get = (values: string[], index: number) => index >= 0 ? values[index]?.trim() ?? "" : "";
  return records.slice(1).map((values) => {
    // Imported status is only a source claim; authorization requires an explicit in-app review.
    const legalReview: ImportedEmailRow["legalReview"] = "pending";
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
