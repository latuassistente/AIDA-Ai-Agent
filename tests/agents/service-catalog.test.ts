import { describe, expect, it } from "vitest";
import { defaultAgents } from "../../packages/agents/src/catalog";
import { serviceCatalog, validateServiceCatalog } from "../../packages/agents/src/service-catalog";

describe("AIDA modular service catalog", () => {
  it("has unique service IDs and references registered specialist agents", () => {
    expect(validateServiceCatalog()).toEqual([]);
    expect(new Set(serviceCatalog.map((service) => service.id)).size).toBe(serviceCatalog.length);
    const agentIds = new Set(defaultAgents.map((agent) => agent.id));
    expect(serviceCatalog.every((service) => agentIds.has(service.agentId))).toBe(true);
  });

  it("marks external integrations as planned until they are implemented and verified", () => {
    for (const id of ["communications.whatsapp", "communications.email", "voice.telephony", "integration.api"]) {
      expect(serviceCatalog.find((service) => service.id === id)?.status).toBe("planned");
    }
  });

  it("includes the independent 2D/3D/4D web studio options", () => {
    expect(serviceCatalog.some((service) => service.id === "web.presentation")).toBe(true);
    expect(serviceCatalog.some((service) => service.id === "web.experience-3d")).toBe(true);
    expect(serviceCatalog.some((service) => service.id === "web.experience-4d")).toBe(true);
  });
});
