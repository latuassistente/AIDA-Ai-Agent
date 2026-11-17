import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getVerifiedAidaSession } from "../../../../../lib/verified-session";

type Context = { params: Promise<{ campaignId: string }> };
const BATCH_SIZE = 50;

function unsubscribeToken(campaignId: string, recipientId: string, secret: string): string {
  const payload = Buffer.from(JSON.stringify({ campaignId, recipientId })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export async function POST(request: Request, context: Context) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }
  const session = await getVerifiedAidaSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const payload: unknown = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload) || (payload as Record<string, unknown>).confirmSend !== true) {
    return NextResponse.json({ error: "Invio non confermato." }, { status: 400 });
  }

  const deliveryEndpoint = process.env.EMAIL_DELIVERY_API_URL;
  const deliveryKey = process.env.EMAIL_DELIVERY_API_KEY;
  const from = process.env.EMAIL_DELIVERY_FROM;
  const unsubscribeSecret = process.env.EMAIL_CAMPAIGN_UNSUBSCRIBE_SECRET;
  const appBaseUrl = process.env.APP_BASE_URL;
  if (!deliveryEndpoint || !deliveryKey || !from || !unsubscribeSecret || !appBaseUrl) {
    return NextResponse.json({ error: "Provider di invio o configurazione disiscrizione non completi." }, { status: 503 });
  }
  let providerUrl: URL;
  let baseUrl: URL;
  try { providerUrl = new URL(deliveryEndpoint); baseUrl = new URL(appBaseUrl); }
  catch { return NextResponse.json({ error: "URL provider o URL applicazione non validi." }, { status: 503 }); }
  if (providerUrl.protocol !== "https:" || baseUrl.protocol !== "https:") {
    return NextResponse.json({ error: "Provider e URL applicazione devono usare HTTPS." }, { status: 503 });
  }

  const { campaignId } = await context.params;
  const campaign = await prisma.emailCampaign.findFirst({
    where: { id: campaignId, tenantId: session.tenantId },
    select: { id: true, name: true, subject: true, htmlContent: true, status: true },
  });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (campaign.status !== "DRAFT" && campaign.status !== "PARTIALLY_SENT") {
    return NextResponse.json({ error: "La campagna non è in uno stato inviabile." }, { status: 409 });
  }
  if (!campaign.subject?.trim() || !campaign.htmlContent?.trim()) {
    return NextResponse.json({ error: "Oggetto e contenuto HTML devono essere salvati prima dell'invio." }, { status: 422 });
  }
  if (!campaign.htmlContent.includes("{{unsubscribe_url}}")) {
    return NextResponse.json({ error: "Il modello HTML deve contenere il segnaposto {{unsubscribe_url}} per la disiscrizione." }, { status: 422 });
  }

  const eligibleWhere = {
    campaignId,
    legalReview: "approved",
    verificationStatus: "valid",
    suppressed: false,
    unsubscribed: false,
  };
  const eligibleCount = await prisma.emailCampaignRecipient.count({ where: eligibleWhere });
  if (eligibleCount === 0) {
    return NextResponse.json({ error: "Nessun destinatario idoneo: servono autorizzazione approvata, email verificata valida e assenza di soppressione/disiscrizione." }, { status: 409 });
  }
  const recipients = await prisma.emailCampaignRecipient.findMany({
    where: { ...eligibleWhere, events: { none: { eventType: "sent" } } },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
    select: { id: true, email: true },
  });
  if (recipients.length === 0) {
    await prisma.emailCampaign.update({ where: { id: campaign.id }, data: { status: "SENT" } });
    return NextResponse.json({ sent: 0, remaining: 0, complete: true });
  }

  let sent = 0;
  let failed = 0;
  for (const recipient of recipients) {
    const token = unsubscribeToken(campaignId, recipient.id, unsubscribeSecret);
    const unsubscribeUrl = new URL("/api/email-campaign/unsubscribe", baseUrl);
    unsubscribeUrl.searchParams.set("token", token);
    const idempotencyKey = `aida-${campaignId}-${recipient.id}`;
    try {
      const response = await fetch(providerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${deliveryKey}`,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          from,
          to: recipient.email,
          subject: campaign.subject,
          html: campaign.htmlContent.replaceAll("{{unsubscribe_url}}", unsubscribeUrl.toString()),
          idempotencyKey,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl.toString()}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) { failed += 1; continue; }
      const result: unknown = await response.json();
      if (!result || typeof result !== "object" || !("id" in result) || typeof result.id !== "string" || !result.id) {
        failed += 1;
        continue;
      }
      await prisma.emailCampaignEvent.create({
        data: {
          campaignId,
          recipientId: recipient.id,
          eventType: "sent",
          providerEventId: `aida-send:${recipient.id}`,
          metadata: { providerMessageId: result.id, provider: process.env.EMAIL_DELIVERY_PROVIDER_NAME ?? "AIDA HTTP delivery adapter" },
        },
      });
      sent += 1;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") continue;
      failed += 1;
    }
  }

  const sentTotal = await prisma.emailCampaignEvent.count({ where: { campaignId, eventType: "sent" } });
  const remaining = Math.max(0, eligibleCount - sentTotal);
  const status = remaining === 0 ? "SENT" : sentTotal > 0 ? "PARTIALLY_SENT" : "DRAFT";
  await prisma.emailCampaign.update({ where: { id: campaign.id }, data: { status } });
  await prisma.auditLog.create({
    data: {
      tenantId: session.tenantId,
      actor: session.sub,
      action: "EMAIL_CAMPAIGN_BATCH_SENT",
      decision: "ALLOW",
      target: campaignId,
      details: { attempted: recipients.length, sent, failed, sentTotal, eligibleCount, remaining, provider: process.env.EMAIL_DELIVERY_PROVIDER_NAME ?? "AIDA HTTP delivery adapter" },
    },
  });

  return NextResponse.json({ attempted: recipients.length, sent, failed, sentTotal, eligible: eligibleCount, remaining, complete: remaining === 0, status });
}
