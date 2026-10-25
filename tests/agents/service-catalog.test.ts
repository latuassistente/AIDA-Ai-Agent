import { describe, expect, it } from "vitest";
import { defaultAgents } from "../../packages/agents/src/catalog";
import { configureServices, serviceCatalog, validateServiceCatalog } from "../../packages/agents/src/service-catalog";

describe("AIDA modular service catalog", () => {
  it("has unique service IDs and references registered specialist agents", () => {
    expect(validateServiceCatalog()).toEqual([]);
    expect(new Set(serviceCatalog.map((service) => service.id)).size).toBe(serviceCatalog.length);
    const agentIds = new Set(defaultAgents.map((agent) => agent.id));
    expect(serviceCatalog.every((service) => agentIds.has(service.agentId))).toBe(true);
  });

  it("marks external integrations as planned until they are implemented and verified", () => {
    for (const id of ["communications.whatsapp", "communications.email", "voice.telephony", "integration.api", "find.discovery", "booking.reservations"]) {
      expect(serviceCatalog.find((service) => service.id === id)?.status).toBe("planned");
    }
  });

  it("resolves dependencies and blocks services unavailable on a plan", () => {
    const result = configureServices(["web.experience-4d"], "enterprise");
    expect(result.valid).toBe(true);
    expect(result.services.map((service) => service.id)).toContain("web.experience-3d");
    expect(result.automaticallyIncludedDependencies).toContain("web.experience-3d");

    const restricted = configureServices(["web.experience-4d"], "starter");
    expect(restricted.valid).toBe(false);
    expect(restricted.errors.length).toBeGreaterThan(0);
  });

  it("includes the independent 2D/3D/4D web studio options", () => {
    expect(serviceCatalog.some((service) => service.id === "web.presentation")).toBe(true);
    expect(serviceCatalog.some((service) => service.id === "web.experience-3d")).toBe(true);
    expect(serviceCatalog.some((service) => service.id === "web.experience-4d")).toBe(true);
    expect(serviceCatalog.find((service) => service.id === "find.discovery")?.agentId).toBe("find");
    expect(serviceCatalog.find((service) => service.id === "booking.reservations")?.agentId).toBe("booking");
  });
});
