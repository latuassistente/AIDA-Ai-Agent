import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getVerifiedAidaSession } from "../../../../../lib/verified-session";

type Context = { params: Promise<{ campaignId: string }> };
const eventTypes = ["sent", "delivered", "bounced", "opened", "clicked", "replied", "positive", "ko"] as const;

export async function GET(_request: Request, context: Context) {
  const session = await getVerifiedAidaSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { campaignId } = await context.params;
  const campaign = await prisma.emailCampaign.findFirst({
    where: { id: campaignId, tenantId: session.tenantId },
    select: {
      id: true, name: true, status: true, createdAt: true,
      recipients: { select: { id: true, verificationStatus: true, legalReview: true, suppressed: true, unsubscribed: true } },
      events: { select: { recipientId: true, eventType: true, occurredAt: true } },
    },
  });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const uniqueRecipients = (type: string) => new Set(
    campaign.events.filter((event) => event.eventType === type && event.recipientId).map((event) => event.recipientId),
  ).size;
  const replies = uniqueRecipients("replied");
  const positive = uniqueRecipients("positive");
  const ko = uniqueRecipients("ko");
  const count = (type: string) => uniqueRecipients(type);
  const eligible = campaign.recipients.filter((recipient) =>
    recipient.legalReview === "approved" &&
    recipient.verificationStatus === "valid" &&
    !recipient.suppressed &&
    !recipient.unsubscribed,
  ).length;

  return NextResponse.json({
    campaign: { id: campaign.id, name: campaign.name, status: campaign.status, createdAt: campaign.createdAt },
    recipients: campaign.recipients.length,
    eligible,
    excluded: campaign.recipients.length - eligible,
    sent: count("sent"),
    delivered: count("delivered"),
    bounced: count("bounced"),
    opensDetected: count("opened"),
    clicks: count("clicked"),
    replies,
    positive,
    ko,
    pendingOutcome: Math.max(0, replies - positive - ko),
    readReceiptsAvailable: false,
    openTrackingCaveat: "Le aperture sono segnali di tracking e non provano una lettura umana.",
    eventTypes,
  });
}
