import { describe, expect, it } from "vitest";
import { normalizeLead } from "./lead-extractor-normalize";

describe("GMExtractor XLSX field mapping", () => {
  it("maps the Italian column names from the supplied export", () => {
    const lead = normalizeLead({
      Nome: "Studio Esempio",
      "Numero di cellulare": "3683035695",
      categoria: "Commercialista",
      Address: "Via Roma 10, Caserta CE",
      "Sito web": "https://example.it",
      "E-mail identificativo utente": "INFO@example.it",
      latitudine: "41.0896698",
      longitudine: "14.3387262",
      "CAP e Comune": "81100 Caserta CE",
    }, "google_maps");
    expect(lead.companyName).toBe("Studio Esempio");
    expect(lead.mobilePhone).toBe("3683035695");
    expect(lead.category).toBe("Commercialista");
    expect(lead.postalCode).toBe("81100");
    expect(lead.city).toBe("Caserta");
    expect(lead.email).toBe("info@example.it");
    expect(lead.latitude).toBeCloseTo(41.0896698);
  });
});
