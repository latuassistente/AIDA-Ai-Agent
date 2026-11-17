import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getVerifiedAidaSession } from "../../../../lib/verified-session";

const BATCH_SIZE = 50;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }
  const session = await getVerifiedAidaSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const endpoint = process.env.B2B_LEAD_EXTRACTOR_API_URL;
  const apiKey = process.env.B2B_LEAD_EXTRACTOR_API_KEY;
  if (!endpoint || !apiKey) {
    return NextResponse.json({ error: "Connettore B2B Lead Extractor non configurato." }, { status: 503 });
  }
  let providerUrl: URL;
  try { providerUrl = new URL(endpoint); }
  catch { return NextResponse.json({ error: "URL del connettore B2B non valido." }, { status: 503 }); }
  if (providerUrl.protocol !== "https:") {
    return NextResponse.json({ error: "Il connettore B2B deve usare HTTPS." }, { status: 503 });
  }

  let payload: unknown;
  try { payload = await request.json(); }
  catch { return NextResponse.json({ error: "Corpo JSON non valido." }, { status: 400 }); }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Dati importazione non validi." }, { status: 400 });
  }
  const data = payload as Record<string, unknown>;
  const campaignName = data.campaignName;
  const segmentId = data.segmentId;
  if (typeof campaignName !== "string" || !campaignName.trim() || campaignName.length > 160 ||
      typeof segmentId !== "string" || !segmentId.trim() || segmentId.length > 160) {
    return NextResponse.json({ error: "Nome campagna e identificativo segmento sono obbligatori." }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(providerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ tenantId: session.tenantId, segmentId: segmentId.trim(), limit: BATCH_SIZE }),
      signal: AbortSignal.timeout(30_000),
      redirect: "error",
    });
  } catch {
    return NextResponse.json({ error: "Connettore B2B non raggiungibile." }, { status: 502 });
  }
  if (!response.ok) return NextResponse.json({ error: `Connettore B2B ha restituito HTTP ${response.status}.` }, { status: 502 });
  const raw = await response.text();
  if (Buffer.byteLength(raw, "utf8") > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Risposta del connettore B2B oltre 2 MB." }, { status: 502 });
  }

  let providerData: unknown;
  try { providerData = JSON.parse(raw); }
  catch { return NextResponse.json({ error: "Risposta JSON del connettore B2B non valida." }, { status: 502 }); }
  const leads = providerData && typeof providerData === "object" && "leads" in providerData
    ? (providerData as { leads?: unknown }).leads
    : null;
  if (!Array.isArray(leads)) return NextResponse.json({ error: "Il connettore deve restituire un array leads." }, { status: 502 });

  const seen = new Set<string>();
  const seenLeadIds = new Set<string>();
  const recipients = [];
  let duplicates = 0;
  let invalid = 0;
  for (const item of leads.slice(0, BATCH_SIZE)) {
    if (!item || typeof item !== "object" || Array.isArray(item)) { invalid += 1; continue; }
    const lead = item as Record<string, unknown>;
    const sourceLeadId = lead.id;
    const email = lead.email;
    if (typeof sourceLeadId !== "string" || !sourceLeadId.trim() || sourceLeadId.length > 200 ||
        typeof email !== "string" || email.length > 320 || !EMAIL_PATTERN.test(email.trim().toLowerCase())) {
      invalid += 1;
      continue;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (seen.has(normalizedEmail) || seenLeadIds.has(sourceLeadId.trim())) { duplicates += 1; continue; }
    seen.add(normalizedEmail);
    seenLeadIds.add(sourceLeadId.trim());
    const companyName = typeof lead.companyName === "string" ? lead.companyName.slice(0, 250) : undefined;
    const contactName = typeof lead.contactName === "string" ? lead.contactName.slice(0, 200) : undefined;
    const legalBasis = typeof lead.legalBasis === "string" ? lead.legalBasis.slice(0, 300) : undefined;
    const authorizationEvidenceId = typeof lead.authorizationEvidenceId === "string" ? lead.authorizationEvidenceId.slice(0, 200) : undefined;
    recipients.push({
      email: email.trim(),
      normalizedEmail,
      sourceLeadId: sourceLeadId.trim(),
      ...(companyName ? { companyName } : {}),
      ...(contactName ? { contactName } : {}),
      ...(legalBasis ? { legalBasis } : {}),
      ...(authorizationEvidenceId ? { authorizationEvidenceId } : {}),
      legalReview: "pending",
      verificationStatus: "unknown",
      suppressed: lead.suppressed === true,
      unsubscribed: lead.unsubscribed === true,
    });
  }
  if (recipients.length === 0) {
    return NextResponse.json({ error: "Il connettore non ha restituito email valide.", duplicates, invalid }, { status: 422 });
  }

  const campaign = await prisma.emailCampaign.create({
    data: {
      tenantId: session.tenantId,
      name: campaignName.trim(),
      status: "DRAFT",
      recipientSource: "B2B_LEAD_EXTRACTOR",
      recipients: { create: recipients },
    },
    select: { id: true, status: true, recipients: { select: { id: true } } },
  });
  await prisma.auditLog.create({
    data: {
      tenantId: session.tenantId,
      actor: session.sub,
      action: "EMAIL_CAMPAIGN_LEADS_IMPORTED",
      decision: "ALLOW",
      target: campaign.id,
      details: { source: "B2B_LEAD_EXTRACTOR", segmentId: segmentId.trim(), imported: campaign.recipients.length, duplicates, invalid },
    },
  });

  return NextResponse.json({
    campaignId: campaign.id,
    imported: campaign.recipients.length,
    duplicates,
    invalid,
    status: campaign.status,
    source: "B2B_LEAD_EXTRACTOR",
    sent: false,
  }, { status: 201 });
}
