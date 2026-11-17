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

function parseCsvLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]!;
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      values.push(value.trim());
      value = "";
    } else value += char;
  }
  values.push(value.trim());
  return values;
}

export function parseRecipientCsv(csv: string): ImportedEmailRow[] {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) throw new Error("Il CSV deve contenere intestazioni e almeno un destinatario.");
  const delimiter = (lines[0]!.match(/;/g)?.length ?? 0) > (lines[0]!.match(/,/g)?.length ?? 0) ? ";" : ",";
  const headers = parseCsvLine(lines[0]!, delimiter).map((header) => header.trim().toLowerCase());
  const emailIndex = headers.findIndex((header) => ["email", "e-mail", "indirizzo email"].includes(header));
  if (emailIndex < 0) throw new Error("Colonna obbligatoria mancante: email.");
  const find = (...names: string[]) => headers.findIndex((header) => names.includes(header));
  const get = (values: string[], index: number) => index >= 0 ? values[index]?.trim() ?? "" : "";
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line, delimiter);
    const legalReviewValue = get(values, find("legalreview", "stato autorizzazione")).toLowerCase();
    return {
      email: get(values, emailIndex),
      companyName: get(values, find("companyname", "azienda", "ragione sociale")) || undefined,
      contactName: get(values, find("contactname", "referente", "nome contatto")) || undefined,
      legalBasis: get(values, find("legalbasis", "base giuridica")) || undefined,
      authorizationEvidenceId: get(values, find("authorizationevidenceid", "prova autorizzazione", "id autorizzazione")) || undefined,
      legalReview: legalReviewValue === "approved" || legalReviewValue === "approvato" ? "approved" : legalReviewValue === "rejected" || legalReviewValue === "rifiutato" ? "rejected" : "pending",
      suppressed: ["1", "true", "si", "sì", "yes"].includes(get(values, find("suppressed", "soppresso")).toLowerCase()),
      unsubscribed: ["1", "true", "si", "sì", "yes"].includes(get(values, find("unsubscribed", "disiscritto")).toLowerCase()),
    };
  }).filter((row) => row.email.length > 0);
}
