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
    return NextResponse.json({ error: "Dati classificazione non validi." }, { status: 400 });
  }
  const data = payload as Record<string, unknown>;
  const recipientId = data.recipientId;
  const outcome = data.outcome;
  if (typeof recipientId !== "string" || !["positive", "ko", "pending"].includes(String(outcome))) {
    return NextResponse.json({ error: "Destinatario o esito non valido." }, { status: 400 });
  }

  const classification = outcome as "positive" | "ko" | "pending";
  const { campaignId } = await context.params;
  const recipient = await prisma.emailCampaignRecipient.findFirst({
    where: { id: recipientId, campaignId, campaign: { tenantId: session.tenantId } },
    select: { id: true, email: true },
  });
  if (!recipient) return NextResponse.json({ error: "Destinatario non trovato." }, { status: 404 });

  const reply = await prisma.emailCampaignEvent.findFirst({
    where: { campaignId, recipientId, eventType: "replied" },
    select: { id: true },
  });
  if (!reply) return NextResponse.json({ error: "È possibile classificare soltanto un destinatario con una risposta registrata." }, { status: 409 });

  await prisma.$transaction(async (tx) => {
    await tx.emailCampaignEvent.deleteMany({
      where: { campaignId, recipientId, eventType: { in: ["positive", "ko"] }, providerEventId: null },
    });
    if (classification !== "pending") {
      await tx.emailCampaignEvent.create({
        data: {
          campaignId,
          recipientId,
          eventType: classification,
          metadata: { classifiedBy: session.sub, classification: "human-reviewed" },
        },
      });
    }
    await tx.auditLog.create({
      data: {
        tenantId: session.tenantId,
        actor: session.sub,
        action: "EMAIL_CAMPAIGN_REPLY_CLASSIFIED",
        decision: "ALLOW",
        target: recipientId,
        details: { campaignId, email: recipient.email, outcome: classification },
      },
    });
  });

  return NextResponse.json({ campaignId, recipientId, outcome: classification, saved: true });
}
