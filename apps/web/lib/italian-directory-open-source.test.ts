import { describe, expect, it } from "vitest";
import { extractDirectoryJsonLd } from "./italian-directory-open-source";

describe("extractDirectoryJsonLd", () => {
  it("extracts business fields from JSON-LD LocalBusiness", () => {
    const html = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness","name":"Studio Esempio","telephone":"+39 080 1234567","address":{"@type":"PostalAddress","streetAddress":"Via Roma 1","postalCode":"70100","addressLocality":"Bari"}}</script>`;
    const rows = extractDirectoryJsonLd(html);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("Studio Esempio");
    expect(rows[0]?.telephone).toBe("+39 080 1234567");
  });

  it("walks arrays and nested ItemList elements and ignores malformed scripts", () => {
    const html = `<script type="application/ld+json">{bad json}</script><script type="application/ld+json">{"@type":"ItemList","itemListElement":[{"@type":"ListItem","item":{"@type":"Organization","name":"Impresa Uno","url":"https://example.it"}}]}</script>`;
    expect(extractDirectoryJsonLd(html).map(row => row.name)).toEqual(["Impresa Uno"]);
  });

  it("deduplicates repeated structured-data entries", () => {
    const item = {"@type":"LocalBusiness","name":"Attività","url":"https://example.it"};
    const html = `<script type="application/ld+json">${JSON.stringify([item,item])}</script>`;
    expect(extractDirectoryJsonLd(html)).toHaveLength(1);
  });
});
