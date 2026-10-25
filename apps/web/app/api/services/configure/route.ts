import { NextResponse } from "next/server";
import {
  configureServices,
  serviceCatalog,
  summarizeServiceConfiguration,
} from "../../../../../../packages/agents/src/service-catalog";

const allowedPlans = new Set(["starter", "pro", "business", "enterprise"]);
const MAX_SELECTED_SERVICES = 100;

/** Read-only catalog endpoint for the workspace configurator. */
export function GET() {
  return NextResponse.json({
    plans: [...allowedPlans],
    services: serviceCatalog.map(({ id, name, family, description, agentId, status, riskLevel, dependencies, includedInPlans, configurable }) => ({
      id, name, family, description, agentId, status, riskLevel, dependencies, includedInPlans, configurable,
    })),
  });
}

/**
 * Resolves a proposed service selection. This endpoint does not persist changes,
 * enable integrations, or execute external actions. Tenant authorization must
 * be enforced by authenticated server-side policy before production use.
 */
export async function POST(request: Request) {
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
  if (!Array.isArray(payload.selectedServiceIds) ||
      payload.selectedServiceIds.length === 0 ||
      payload.selectedServiceIds.length > MAX_SELECTED_SERVICES ||
      !payload.selectedServiceIds.every((id) => typeof id === "string" && id.trim().length > 0)) {
    return NextResponse.json({
      error: `selectedServiceIds must contain 1-${MAX_SELECTED_SERVICES} non-empty service IDs`,
    }, { status: 400 });
  }

  if (typeof payload.plan !== "string" || !allowedPlans.has(payload.plan)) {
    return NextResponse.json({
      error: "plan must be one of: starter, pro, business, enterprise",
    }, { status: 400 });
  }

  const selectedServiceIds = [...new Set(payload.selectedServiceIds as string[])];
  const configuration = configureServices(selectedServiceIds, payload.plan);
  const summary = summarizeServiceConfiguration(configuration);

  return NextResponse.json({
    valid: configuration.valid,
    plan: configuration.plan,
    services: configuration.services,
    automaticallyIncludedDependencies: configuration.automaticallyIncludedDependencies,
    errors: configuration.errors,
    summary,
    persisted: false,
    integrationsActivated: false,
  }, { status: configuration.valid ? 200 : 422 });
}
