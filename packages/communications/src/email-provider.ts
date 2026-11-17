import type { EmailVerification, VerificationStatus } from "./email-campaign";

export interface EmailVerificationProvider {
  readonly id: string;
  verify(email: string): Promise<EmailVerification>;
}

export interface EmailSendRequest {
  campaignId: string;
  recipientId: string;
  to: string;
  subject: string;
  html: string;
  idempotencyKey: string;
}

export interface EmailSendResult {
  providerMessageId: string;
  accepted: boolean;
  acceptedAt: string;
}

export interface EmailDeliveryProvider {
  readonly id: string;
  send(message: EmailSendRequest): Promise<EmailSendResult>;
}

export interface EmailReplyProvider {
  readonly id: string;
  listReplies(input: { campaignId: string; since?: string }): Promise<Array<{
    recipientEmail: string;
    receivedAt: string;
    externalMessageId: string;
    textExcerpt?: string;
  }>>;
}

export interface EmailBrandTemplate {
  brandName: string;
  headline: string;
  bodyText: string;
  ctaLabel: string;
  ctaUrl: string;
  accentColor: string;
  logoUrl?: string;
  footerText: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char] ?? char);
}

function safeHttpUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("CTA URL must use HTTP or HTTPS.");
  return url.toString();
}

export function renderResponsiveEmailHtml(template: EmailBrandTemplate): string {
  if (!/^#[0-9a-f]{6}$/i.test(template.accentColor)) throw new Error("Accent color must be a six-digit hex color.");
  const ctaUrl = escapeHtml(safeHttpUrl(template.ctaUrl));
  const logo = template.logoUrl
    ? `<img src="${escapeHtml(safeHttpUrl(template.logoUrl))}" alt="${escapeHtml(template.brandName)}" width="150" style="max-width:150px;height:auto;border:0;display:block;margin:0 auto 22px">`
    : "";
  const body = escapeHtml(template.bodyText).replace(/\n/g, "<br>");
  return `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>${escapeHtml(template.headline)}</title>
<style>body{margin:0;padding:0;background:#f3f5f7;font-family:Arial,Helvetica,sans-serif}.wrap{width:100%;padding:32px 12px}.card{max-width:600px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden}.content{padding:38px 34px;color:#29313d;line-height:1.65}.cta{display:inline-block;background:${template.accentColor};color:#fff!important;text-decoration:none;padding:13px 22px;border-radius:7px;font-weight:bold}.footer{padding:18px 28px;text-align:center;color:#7b8490;font-size:12px;line-height:1.5}@media(max-width:480px){.content{padding:26px 20px}.wrap{padding:12px 8px}}</style></head>
<body><div class="wrap"><div class="card"><div class="content">${logo}<h1 style="font-size:25px;line-height:1.25;margin:0 0 18px;color:#202936">${escapeHtml(template.headline)}</h1><p style="font-size:15px;margin:0 0 26px">${body}</p><p style="margin:0"><a class="cta" href="${ctaUrl}">${escapeHtml(template.ctaLabel)}</a></p></div><div class="footer">${escapeHtml(template.footerText)}</div></div></div></body></html>`;
}

/** A mailbox cannot be declared active by syntax or MX checks alone. Only a provider result can set valid. */
export function normalizeVerificationResult(input: {
  email: string;
  status: VerificationStatus;
  providerId: string;
  checkedAt?: string;
  reason?: string;
}): EmailVerification {
  return {
    email: input.email.trim().toLowerCase(),
    status: input.status,
    provider: input.providerId,
    checkedAt: input.checkedAt ?? new Date().toISOString(),
    ...(input.reason ? { reason: input.reason } : {}),
  };
}
