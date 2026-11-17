import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getVerifiedAidaSession } from "../../../../../lib/verified-session";

type Context = { params: Promise<{ campaignId: string }> };

export async function PATCH(request: Request, context: Context) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }
  const session = await getVerifiedAidaSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  let payload: unknown;
  try { payload = await request.json(); }
  catch { return NextResponse.json({ error: "Corpo JSON non valido." }, { status: 400 }); }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Dati autorizzazione non validi." }, { status: 400 });
  }
  const data = payload as Record<string, unknown>;
  const recipientId = data.recipientId;
  const legalReview = data.legalReview;
  const legalBasis = data.legalBasis;
  const authorizationEvidenceId = data.authorizationEvidenceId;
  if (typeof recipientId !== "string" || !["approved", "rejected", "pending"].includes(String(legalReview))) {
    return NextResponse.json({ error: "Destinatario o stato autorizzazione non valido." }, { status: 400 });
  }
  if (legalReview === "approved" &&
      (typeof legalBasis !== "string" || !legalBasis.trim() || typeof authorizationEvidenceId !== "string" || !authorizationEvidenceId.trim())) {
    return NextResponse.json({ error: "Per approvare servono base giuridica e riferimento alla prova documentale." }, { status: 422 });
  }

  const { campaignId } = await context.params;
  const recipient = await prisma.emailCampaignRecipient.findFirst({
    where: { id: recipientId, campaignId, campaign: { tenantId: session.tenantId } },
    select: { id: true, email: true },
  });
  if (!recipient) return NextResponse.json({ error: "Destinatario non trovato." }, { status: 404 });

  await prisma.$transaction([
    prisma.emailCampaignRecipient.update({
      where: { id: recipient.id },
      data: {
        legalReview,
        ...(typeof legalBasis === "string" ? { legalBasis: legalBasis.trim() || null } : {}),
        ...(typeof authorizationEvidenceId === "string" ? { authorizationEvidenceId: authorizationEvidenceId.trim() || null } : {}),
      },
    }),
    prisma.auditLog.create({
      data: {
        tenantId: session.tenantId,
        actor: session.sub,
        action: "EMAIL_CAMPAIGN_RECIPIENT_AUTHORIZATION_REVIEWED",
        decision: "ALLOW",
        target: recipient.id,
        details: {
          campaignId,
          email: recipient.email,
          legalReview,
          legalBasis: typeof legalBasis === "string" ? legalBasis.trim() : null,
          authorizationEvidenceId: typeof authorizationEvidenceId === "string" ? authorizationEvidenceId.trim() : null,
        },
      },
    }),
  ]);

  return NextResponse.json({ campaignId, recipientId, legalReview, reviewed: true });
}
