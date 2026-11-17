import { describe, expect, it } from "vitest";
import { parseRecipientCsv } from "./recipient-csv";

describe("recipient CSV parser", () => {
  it("parses comma-separated files with quoted fields", () => {
    const rows = parseRecipientCsv('email,azienda,referente,legalReview,legalBasis,authorizationEvidenceId\ninfo@example.it,"Alfa, Srl",Mario,approved,consent,proof-1');
    expect(rows[0]?.companyName).toBe("Alfa, Srl");
    expect(rows[0]?.legalReview).toBe("approved");
  });

  it("parses semicolon-separated Italian exports", () => {
    const rows = parseRecipientCsv("email;azienda;soppresso\ninfo@example.it;Alfa;si");
    expect(rows[0]?.suppressed).toBe(true);
  });

  it("requires an email column", () => {
    expect(() => parseRecipientCsv("azienda\nAlfa")).toThrow("Colonna obbligatoria mancante: email.");
  });
});
