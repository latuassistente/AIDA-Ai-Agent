import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

function verifyToken(token: string, secret: string): { campaignId: string; recipientId: string } | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const left = Buffer.from(expected);
  const right = Buffer.from(signature);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
    if (typeof data.campaignId !== "string" || typeof data.recipientId !== "string") return null;
    return { campaignId: data.campaignId, recipientId: data.recipientId };
  } catch { return null; }
}

function htmlPage(token: string): string {
  return `<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gestione iscrizione</title><body style="font-family:Arial,sans-serif;background:#f4f5f7;padding:32px"><main style="max-width:520px;margin:40px auto;background:#fff;padding:28px;border-radius:12px"><h1 style="font-size:22px">Disiscrizione email</h1><p>Conferma la disiscrizione da questa comunicazione. L'operazione aggiornerà la lista di soppressione.</p><form method="post" action="/api/email-campaign/unsubscribe"><input type="hidden" name="token" value="${token}"><button type="submit" style="background:#202635;color:#fff;border:0;border-radius:7px;padding:12px 18px">Conferma disiscrizione</button></form></main></body></html>`;
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const secret = process.env.EMAIL_CAMPAIGN_UNSUBSCRIBE_SECRET;
  if (!secret || secret.length < 32 || !verifyToken(token, secret)) {
    return new NextResponse("Link di disiscrizione non valido o scaduto.", { status: 400 });
  }
  return new NextResponse(htmlPage(token), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const secret = process.env.EMAIL_CAMPAIGN_UNSUBSCRIBE_SECRET;
  if (!secret || secret.length < 32) return NextResponse.json({ error: "Disiscrizione non configurata o segreto troppo corto." }, { status: 503 });
  let token = new URL(request.url).searchParams.get("token") ?? "";
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload = await request.json().catch(() => null) as { token?: unknown } | null;
    if (!token) token = typeof payload?.token === "string" ? payload.token : "";
  } else {
    const form = await request.formData().catch(() => null);
    const value = form?.get("token");
    if (!token) token = typeof value === "string" ? value : "";
  }
  const verified = verifyToken(token, secret);
  if (!verified) return NextResponse.json({ error: "Link di disiscrizione non valido o scaduto." }, { status: 400 });

  const recipient = await prisma.emailCampaignRecipient.findFirst({
    where: { id: verified.recipientId, campaignId: verified.campaignId },
    select: { id: true, email: true, campaign: { select: { tenantId: true } } },
  });
  if (!recipient) return NextResponse.json({ error: "Destinatario non trovato." }, { status: 404 });

  await prisma.emailCampaignRecipient.update({ where: { id: recipient.id }, data: { unsubscribed: true } });
  try {
    await prisma.emailCampaignEvent.create({
      data: {
        campaignId: verified.campaignId,
        recipientId: recipient.id,
        eventType: "unsubscribed",
        providerEventId: `unsubscribe:${createHash("sha256").update(token).digest("hex")}`,
      },
    });
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "P2002")) throw error;
  }
  await prisma.auditLog.create({
    data: {
      tenantId: recipient.campaign.tenantId,
      actor: "recipient:self-service",
      action: "EMAIL_CAMPAIGN_RECIPIENT_UNSUBSCRIBED",
      decision: "ALLOW",
      target: recipient.id,
      details: { campaignId: verified.campaignId, email: recipient.email },
    },
  });
  if (contentType.includes("application/json")) return NextResponse.json({ unsubscribed: true });
  return new NextResponse("<!doctype html><html lang=\"it\"><meta charset=\"utf-8\"><title>Disiscrizione completata</title><body style=\"font-family:Arial,sans-serif;padding:40px\"><h1>Disiscrizione completata</h1><p>Non riceverai altre comunicazioni da questa campagna.</p></body></html>", { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
