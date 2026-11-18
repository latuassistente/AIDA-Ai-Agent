import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getVerifiedAidaSession } from "../../../../../lib/verified-session";

type Context = { params: Promise<{ campaignId: string }> };
const BATCH_SIZE = 50;
const allowedStatuses = new Set(["valid", "invalid", "risky", "unknown"]);

export async function POST(request: Request, context: Context) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }
  const session = await getVerifiedAidaSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const endpoint = process.env.EMAIL_VERIFICATION_API_URL;
  const apiKey = process.env.EMAIL_VERIFICATION_API_KEY;
  if (!endpoint || !apiKey) {
    return NextResponse.json({ error: "Provider di verifica non configurato: impostare EMAIL_VERIFICATION_API_URL e EMAIL_VERIFICATION_API_KEY." }, { status: 503 });
  }
  let providerUrl: URL;
  try { providerUrl = new URL(endpoint); }
  catch { return NextResponse.json({ error: "URL provider di verifica non valido." }, { status: 503 }); }
  if (providerUrl.protocol !== "https:") {
    return NextResponse.json({ error: "Il provider di verifica deve usare HTTPS." }, { status: 503 });
  }

  const { campaignId } = await context.params;
  const campaign = await prisma.emailCampaign.findFirst({
    where: { id: campaignId, tenantId: session.tenantId },
    select: { id: true },
  });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const recipients = await prisma.emailCampaignRecipient.findMany({
    where: { campaignId, verificationStatus: { in: ["unknown", "risky"] } },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
    select: { id: true, email: true },
  });
  if (recipients.length === 0) return NextResponse.json({ checked: 0, remaining: 0, results: {} });

  const counts: Record<string, number> = { valid: 0, invalid: 0, risky: 0, unknown: 0, failed: 0 };
  for (const recipient of recipients) {
    try {
      const response = await fetch(providerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ email: recipient.email }),
        signal: AbortSignal.timeout(12_000),
        redirect: "error",
      });
      if (!response.ok) { counts.failed = (counts.failed ?? 0) + 1; continue; }
      const result: unknown = await response.json();
      if (!result || typeof result !== "object" || !("status" in result) ||
          typeof result.status !== "string" || !allowedStatuses.has(result.status)) {
        counts.failed = (counts.failed ?? 0) + 1;
        continue;
      }
      const status = result.status;
      await prisma.emailCampaignRecipient.update({
        where: { id: recipient.id },
        data: {
          verificationStatus: status,
          verificationProvider: process.env.EMAIL_VERIFICATION_PROVIDER_NAME ?? "AIDA HTTP verification adapter",
          verifiedAt: new Date(),
        },
      });
      counts[status] = (counts[status] ?? 0) + 1;
    } catch {
      counts.failed = (counts.failed ?? 0) + 1;
    }
  }

  const remaining = await prisma.emailCampaignRecipient.count({
    where: { campaignId, verificationStatus: { in: ["unknown", "risky"] } },
  });
  await prisma.auditLog.create({
    data: {
      tenantId: session.tenantId,
      actor: session.sub,
      action: "EMAIL_CAMPAIGN_RECIPIENTS_VERIFIED",
      decision: "ALLOW",
      target: campaignId,
      details: { checked: recipients.length, remaining, counts, provider: process.env.EMAIL_VERIFICATION_PROVIDER_NAME ?? "AIDA HTTP verification adapter" },
    },
  });

  return NextResponse.json({ checked: recipients.length, remaining, results: counts, batchSize: BATCH_SIZE });
}
