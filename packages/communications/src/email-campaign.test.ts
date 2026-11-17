import { describe, expect, it } from "vitest";
import {
  buildCampaignReport,
  evaluateRecipients,
  normalizeEmail,
  type EmailRecipient,
  type EmailVerification,
} from "./email-campaign";

const baseRecipient: EmailRecipient = {
  id: "r1",
  email: "  SALES@EXAMPLE.COM ",
  source: "manual-upload",
  legalReview: "approved",
  legalBasis: "documented legitimate interest review",
  authorizationEvidenceId: "evidence-1",
};

const validVerification: EmailVerification = {
  email: "sales@example.com",
  status: "valid",
  checkedAt: "2026-11-17T10:00:00.000Z",
  provider: "connected-verification-provider",
};

describe("email campaign recipient validation", () => {
  it("normalizes email addresses", () => {
    expect(normalizeEmail("  SALES@Example.COM ")).toBe("sales@example.com");
  });

  it("accepts a verified recipient only when authorization evidence is approved", () => {
    const [decision] = evaluateRecipients([baseRecipient], [validVerification]);
    expect(decision?.eligible).toBe(true);
    expect(decision?.normalizedEmail).toBe("sales@example.com");
  });

  it("blocks public/unreviewed, unverified, suppressed and duplicate recipients", () => {
    const unreviewed = { ...baseRecipient, id: "r2", legalReview: "pending" as const };
    const suppressed = { ...baseRecipient, id: "r3", suppressed: true };
    const decisions = evaluateRecipients(
      [unreviewed, suppressed, baseRecipient, { ...baseRecipient, id: "r4" }],
      [validVerification],
    );
    expect(decisions[0]?.reasons).toContain("marketing-authorization-not-approved");
    expect(decisions[1]?.reasons).toContain("suppressed");
    expect(decisions[3]?.reasons).toContain("duplicate-email");
  });

  it("requires a connected verifier result and rejects invalid addresses", () => {
    const [missing] = evaluateRecipients([baseRecipient]);
    const [invalid] = evaluateRecipients(
      [{ ...baseRecipient, email: "not-an-email" }],
      [{ ...validVerification, email: "not-an-email", status: "invalid" }],
    );
    expect(missing?.eligible).toBe(false);
    expect(missing?.reasons).toContain("email-not-verified");
    expect(invalid?.reasons).toContain("email-format-invalid");
  });
});

describe("email campaign reporting", () => {
  it("reports sent, delivery, tracking and explicit positive/KO classifications", () => {
    const decisions = evaluateRecipients([baseRecipient], [validVerification]);
    const report = buildCampaignReport(decisions, [
      { recipientId: "r1", type: "sent", occurredAt: "2026-11-17T10:01:00Z" },
      { recipientId: "r1", type: "delivered", occurredAt: "2026-11-17T10:01:02Z" },
      { recipientId: "r1", type: "opened", occurredAt: "2026-11-17T10:05:00Z" },
      { recipientId: "r1", type: "replied", occurredAt: "2026-11-17T11:00:00Z" },
    ], [{
      recipientId: "r1",
      outcome: "positive",
      classifiedAt: "2026-11-17T11:01:00Z",
      evidenceId: "reply-1",
    }]);

    expect(report.sent).toBe(1);
    expect(report.delivered).toBe(1);
    expect(report.opensDetected).toBe(1);
    expect(report.replies).toBe(1);
    expect(report.positive).toBe(1);
    expect(report.ko).toBe(0);
    expect(report.readReceiptsAvailable).toBe(false);
  });
});
