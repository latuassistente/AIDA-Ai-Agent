import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

const acceptedTypes = new Set(["sent", "delivered", "bounced", "opened", "clicked", "replied"]);

function validSignature(rawBody: string, supplied: string, secret: string): boolean {
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  const secret = process.env.EMAIL_CAMPAIGN_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook non configurato." }, { status: 503 });
  const rawBody = await request.text();
  const signature = request.headers.get("x-aida-signature") ?? "";
  if (!validSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Firma webhook non valida." }, { status: 401 });
  }

  let payload: unknown;
  try { payload = JSON.parse(rawBody); }
  catch { return NextResponse.json({ error: "Payload JSON non valido." }, { status: 400 }); }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Payload webhook non valido." }, { status: 400 });
  }
  const event = payload as Record<string, unknown>;
  const campaignId = event.campaignId;
  const eventId = event.eventId;
  const eventType = event.type;
  const email = event.email;
  if (typeof campaignId !== "string" || typeof eventId !== "string" || eventId.length < 1 || eventId.length > 200 ||
      typeof eventType !== "string" || !acceptedTypes.has(eventType) ||
      typeof email !== "string" || email.length > 320) {
    return NextResponse.json({ error: "Campi evento mancanti o non validi." }, { status: 400 });
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return NextResponse.json({ error: "Indirizzo email evento non valido." }, { status: 400 });
  }
  const occurredAt = typeof event.occurredAt === "string" ? new Date(event.occurredAt) : new Date();
  if (Number.isNaN(occurredAt.getTime())) return NextResponse.json({ error: "Data evento non valida." }, { status: 400 });

  const recipient = await prisma.emailCampaignRecipient.findFirst({
    where: { campaignId, normalizedEmail },
    select: { id: true },
  });
  if (!recipient) return NextResponse.json({ error: "Destinatario non trovato nella campagna." }, { status: 404 });

  try {
    await prisma.emailCampaignEvent.create({
      data: {
        campaignId,
        recipientId: recipient.id,
        eventType,
        providerEventId: eventId,
        occurredAt,
        ...(eventType === "replied" && typeof event.textExcerpt === "string"
          ? { metadata: { textExcerpt: event.textExcerpt.slice(0, 1000) } }
          : {}),
      },
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ accepted: true, duplicate: true });
    }
    throw error;
  }

  return NextResponse.json({ accepted: true, duplicate: false }, { status: 202 });
}
