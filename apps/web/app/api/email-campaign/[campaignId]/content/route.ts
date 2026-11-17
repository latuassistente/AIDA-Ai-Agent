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
    return NextResponse.json({ error: "Dati campagna non validi." }, { status: 400 });
  }
  const data = payload as Record<string, unknown>;
  const subject = data.subject;
  const htmlContent = data.htmlContent;
  if (typeof subject !== "string" || !subject.trim() || subject.length > 240) {
    return NextResponse.json({ error: "Oggetto obbligatorio (massimo 240 caratteri)." }, { status: 400 });
  }
  if (typeof htmlContent !== "string" || !htmlContent.trim() || htmlContent.length > 200_000) {
    return NextResponse.json({ error: "HTML obbligatorio (massimo 200 KB)." }, { status: 400 });
  }

  const { campaignId } = await context.params;
  const campaign = await prisma.emailCampaign.findFirst({
    where: { id: campaignId, tenantId: session.tenantId },
    select: { id: true, status: true },
  });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (campaign.status !== "DRAFT") {
    return NextResponse.json({ error: "È possibile modificare soltanto una campagna in bozza." }, { status: 409 });
  }

  await prisma.emailCampaign.update({
    where: { id: campaign.id },
    data: { subject: subject.trim(), htmlContent },
  });
  await prisma.auditLog.create({
    data: {
      tenantId: session.tenantId,
      actor: session.sub,
      action: "EMAIL_CAMPAIGN_CONTENT_UPDATED",
      decision: "ALLOW",
      target: campaign.id,
      details: { subjectLength: subject.trim().length, htmlLength: htmlContent.length },
    },
  });

  return NextResponse.json({ campaignId: campaign.id, saved: true, status: "DRAFT" });
}
