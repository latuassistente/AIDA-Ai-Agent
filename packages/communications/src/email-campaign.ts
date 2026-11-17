export type RecipientSource = "manual-upload" | "b2b-lead-extractor";
export type VerificationStatus = "valid" | "invalid" | "unknown" | "risky";
export type LegalReviewStatus = "approved" | "rejected" | "pending";
export type CampaignOutcome = "positive" | "ko" | "pending";

export interface EmailRecipient {
  id: string;
  email: string;
  companyName?: string;
  contactName?: string;
  source: RecipientSource;
  sourceRecordId?: string;
  legalReview: LegalReviewStatus;
  legalBasis?: string;
  authorizationEvidenceId?: string;
  suppressed?: boolean;
  unsubscribed?: boolean;
}

export interface EmailVerification {
  email: string;
  status: VerificationStatus;
  checkedAt: string;
  provider: string;
  reason?: string;
}

export interface RecipientDecision {
  recipient: EmailRecipient;
  normalizedEmail: string;
  eligible: boolean;
  reasons: string[];
  verification?: EmailVerification;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Applies the same eligibility gate to uploaded lists and B2B Lead Extractor records.
 * A public address or a syntactically valid address is not, by itself, authorization.
 */
export function evaluateRecipients(
  recipients: EmailRecipient[],
  verifications: EmailVerification[] = [],
): RecipientDecision[] {
  const verificationByEmail = new Map(
    verifications.map((item) => [normalizeEmail(item.email), item]),
  );
  const seen = new Set<string>();

  return recipients.map((recipient) => {
    const normalizedEmail = normalizeEmail(recipient.email);
    const reasons: string[] = [];
    const verification = verificationByEmail.get(normalizedEmail);

    if (!EMAIL_PATTERN.test(normalizedEmail)) reasons.push("email-format-invalid");
    if (seen.has(normalizedEmail)) reasons.push("duplicate-email");
    seen.add(normalizedEmail);
    if (recipient.legalReview !== "approved") reasons.push("marketing-authorization-not-approved");
    if (!recipient.legalBasis?.trim()) reasons.push("legal-basis-missing");
    if (!recipient.authorizationEvidenceId?.trim()) reasons.push("authorization-evidence-missing");
    if (recipient.suppressed) reasons.push("suppressed");
    if (recipient.unsubscribed) reasons.push("unsubscribed");
    if (!verification) reasons.push("email-not-verified");
    else if (verification.status !== "valid") reasons.push(`email-verification-${verification.status}`);

    return {
      recipient,
      normalizedEmail,
      eligible: reasons.length === 0,
      reasons,
      ...(verification ? { verification } : {}),
    };
  });
}

export interface CampaignEvent {
  recipientId: string;
  type: "sent" | "delivered" | "bounced" | "opened" | "clicked" | "replied";
  occurredAt: string;
}

export interface CampaignReplyClassification {
  recipientId: string;
  outcome: Exclude<CampaignOutcome, "pending">;
  classifiedAt: string;
  evidenceId: string;
}

export interface CampaignReport {
  recipients: number;
  eligible: number;
  excluded: number;
  sent: number;
  delivered: number;
  bounced: number;
  opensDetected: number;
  clicks: number;
  replies: number;
  positive: number;
  ko: number;
  pendingOutcome: number;
  readReceiptsAvailable: false;
  openTrackingCaveat: string;
}

export function buildCampaignReport(
  decisions: RecipientDecision[],
  events: CampaignEvent[],
  classifications: CampaignReplyClassification[] = [],
): CampaignReport {
  const count = (type: CampaignEvent["type"]) =>
    new Set(events.filter((event) => event.type === type).map((event) => event.recipientId)).size;
  const eligible = decisions.filter((decision) => decision.eligible).length;
  const positive = classifications.filter((item) => item.outcome === "positive").length;
  const ko = classifications.filter((item) => item.outcome === "ko").length;
  const replied = count("replied");

  return {
    recipients: decisions.length,
    eligible,
    excluded: decisions.length - eligible,
    sent: count("sent"),
    delivered: count("delivered"),
    bounced: count("bounced"),
    opensDetected: count("opened"),
    clicks: count("clicked"),
    replies: replied,
    positive,
    ko,
    pendingOutcome: Math.max(0, replied - positive - ko),
    readReceiptsAvailable: false,
    openTrackingCaveat: "An open event is a tracking signal, not proof that a person read the email. Some email clients block or prefetch tracking pixels.",
  };
}

/** Prevent duplicate campaign dispatches by producing a stable recipient key. */
export function campaignDispatchKey(campaignId: string, recipientEmail: string): string {
  return `${campaignId.trim()}: ${normalizeEmail(recipientEmail)}`;
}
