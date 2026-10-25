import { NextResponse } from "next/server";
import { configureServices } from "../../../../../../packages/agents/src/service-catalog";
import { prisma } from "../../../../lib/prisma";
import { getVerifiedAidaSession } from "../../../../lib/verified-session";

const allowedPlans = new Set(["starter", "pro", "business", "enterprise"]);
const MAX_SELECTED_SERVICES = 100;

/** Persist a validated service selection for the tenant in the signed server session. */
export async function GET() {
  const session = await getVerifiedAidaSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const configuration = await prisma.tenantServiceConfiguration.findUnique({
    where: { tenantId: session.tenantId },
    select: { plan: true, selectedServiceIds: true, updatedAt: true, updatedBy: true },
  });
  return NextResponse.json({ configuration, persisted: true });
}

export async function POST(request: Request) {
  const session = await getVerifiedAidaSession();
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
  }
  const payload = body as { selectedServiceIds?: unknown; plan?: unknown };
  if (!Array.isArray(payload.selectedServiceIds) || payload.selectedServiceIds.length === 0 ||
      payload.selectedServiceIds.length > MAX_SELECTED_SERVICES ||
      !payload.selectedServiceIds.every((id) => typeof id === "string" && id.trim().length > 0)) {
    return NextResponse.json({ error: `selectedServiceIds must contain 1-${MAX_SELECTED_SERVICES} non-empty service IDs` }, { status: 400 });
  }
  if (typeof payload.plan !== "string" || !allowedPlans.has(payload.plan)) {
    return NextResponse.json({ error: "plan must be one of: starter, pro, business, enterprise" }, { status: 400 });
  }

  const selectedServiceIds = [...new Set(payload.selectedServiceIds as string[])];
  const resolved = configureServices(selectedServiceIds, payload.plan);
  if (!resolved.valid) {
    return NextResponse.json({ valid: false, errors: resolved.errors, services: resolved.services }, { status: 422 });
  }

  const persistedSelection = resolved.services.map((service) => service.id);
  const saved = await prisma.$transaction(async (tx) => {
    const configuration = await tx.tenantServiceConfiguration.upsert({
      where: { tenantId: session.tenantId },
      create: {
        tenantId: session.tenantId,
        plan: resolved.plan,
        selectedServiceIds: persistedSelection,
        updatedBy: session.sub,
      },
      update: {
        plan: resolved.plan,
        selectedServiceIds: persistedSelection,
        updatedBy: session.sub,
      },
      select: { plan: true, selectedServiceIds: true, updatedAt: true, updatedBy: true },
    });

    await tx.auditLog.create({
      data: {
        tenantId: session.tenantId,
        actor: session.sub,
        action: "SERVICE_CONFIGURATION_UPDATED",
        decision: "ALLOW",
        target: "tenant-service-configuration",
        details: { plan: configuration.plan, selectedCount: persistedSelection.length },
      },
    });
    return configuration;
  });

  return NextResponse.json({ valid: true, configuration: saved, persisted: true, integrationsActivated: false }, { status: 200 });
}
