import { NextResponse } from "next/server";
import { parseRecipientCsv } from "../../../../../../packages/communications/src/recipient-csv";
import { prisma } from "../../../../lib/prisma";
import { getVerifiedAidaSession } from "../../../../lib/verified-session";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }
  const session = await getVerifiedAidaSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  let form: FormData;
  try { form = await request.formData(); }
  catch { return NextResponse.json({ error: "Richiesta multipart non valida." }, { status: 400 }); }

  const file = form.get("file");
  const campaignName = form.get("campaignName");
  if (!(file instanceof File)) return NextResponse.json({ error: "Carica un file CSV." }, { status: 400 });
  if (!file.name.toLowerCase().endsWith(".csv") || file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Formato non supportato o file oltre 5 MB. Carica un CSV." }, { status: 400 });
  }
  if (typeof campaignName !== "string" || !campaignName.trim() || campaignName.length > 160) {
    return NextResponse.json({ error: "Nome campagna obbligatorio (massimo 160 caratteri)." }, { status: 400 });
  }

  let rows;
  try { rows = parseRecipientCsv(await file.text()); }
  catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "CSV non valido." }, { status: 400 });
  }
  if (rows.length > 10000) return NextResponse.json({ error: "Massimo 10.000 righe per importazione." }, { status: 400 });

  const seen = new Set<string>();
  const recipients = [];
  let duplicates = 0;
  let invalid = 0;
  for (const row of rows) {
    const normalizedEmail = row.email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalizedEmail)) { invalid += 1; continue; }
    if (seen.has(normalizedEmail)) { duplicates += 1; continue; }
    seen.add(normalizedEmail);
    recipients.push({
      email: row.email.trim(),
      normalizedEmail,
      companyName: row.companyName,
      contactName: row.contactName,
      legalReview: row.legalReview,
      legalBasis: row.legalBasis,
      authorizationEvidenceId: row.authorizationEvidenceId,
      suppressed: row.suppressed,
      unsubscribed: row.unsubscribed,
      verificationStatus: "unknown",
    });
  }
  if (recipients.length === 0) {
    return NextResponse.json({ error: "Nessun indirizzo email valido da importare.", duplicates, invalid }, { status: 422 });
  }

  const campaign = await prisma.emailCampaign.create({
    data: {
      tenantId: session.tenantId,
      name: campaignName.trim(),
      status: "DRAFT",
      recipientSource: "UPLOAD",
      recipients: { create: recipients },
    },
    select: { id: true, status: true, _count: { select: { recipients: true } } },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: session.tenantId,
      actor: session.sub,
      action: "EMAIL_CAMPAIGN_RECIPIENTS_IMPORTED",
      decision: "ALLOW",
      target: campaign.id,
      details: { source: "UPLOAD", imported: campaign._count.recipients, duplicates, invalid, fileName: file.name },
    },
  });

  return NextResponse.json({
    campaignId: campaign.id,
    imported: campaign._count.recipients,
    duplicates,
    invalid,
    status: campaign.status,
    sent: false,
  }, { status: 201 });
}
