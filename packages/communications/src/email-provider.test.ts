import { describe, expect, it } from "vitest";
import { renderResponsiveEmailHtml, normalizeVerificationResult } from "./email-provider";

describe("email HTML renderer", () => {
  it("renders escaped responsive HTML and a safe CTA", () => {
    const html = renderResponsiveEmailHtml({
      brandName: "A&B",
      headline: "<Offerta>",
      bodyText: "Prima riga\nSeconda riga",
      ctaLabel: "Scopri",
      ctaUrl: "https://example.com/offerta",
      accentColor: "#123456",
      footerText: "Footer",
    });
    expect(html).toContain("&lt;Offerta&gt;");
    expect(html).toContain("Prima riga<br>Seconda riga");
    expect(html).toContain("https://example.com/offerta");
    expect(html).toContain("@media(max-width:480px)");
  });

  it("rejects unsafe CTA protocols and invalid colors", () => {
    expect(() => renderResponsiveEmailHtml({
      brandName: "A", headline: "B", bodyText: "C", ctaLabel: "Vai",
      ctaUrl: "javascript:alert(1)", accentColor: "#123456", footerText: "D",
    })).toThrow();
    expect(() => renderResponsiveEmailHtml({
      brandName: "A", headline: "B", bodyText: "C", ctaLabel: "Vai",
      ctaUrl: "https://example.com", accentColor: "red", footerText: "D",
    })).toThrow("Accent color must be a six-digit hex color.");
  });

  it("keeps provider verification status explicit", () => {
    expect(normalizeVerificationResult({
      email: "TEST@example.com", status: "unknown", providerId: "not-connected",
    }).status).toBe("unknown");
  });
});
