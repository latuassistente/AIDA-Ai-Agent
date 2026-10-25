import { describe, expect, it } from "vitest";
import {
  configureServices,
  getServiceById,
  serviceCatalog,
  summarizeServiceConfiguration,
  validateServiceCatalog,
} from "./service-catalog";

describe("AIDA universal service configurator", () => {
  it("has unique service IDs and valid agent/dependency references", () => {
    expect(validateServiceCatalog()).toEqual([]);
    expect(new Set(serviceCatalog.map((service) => service.id)).size).toBe(serviceCatalog.length);
  });

  it("includes dependencies recursively and records automatic inclusions", () => {
    const result = configureServices(["leads.export"], "business");
    expect(result.valid).toBe(true);
    expect(result.services.map((service) => service.id)).toEqual(
      expect.arrayContaining(["leads.export", "leads.verify", "leads.discover", "research.web"]),
    );
    expect(result.automaticallyIncludedDependencies).toEqual(
      expect.arrayContaining(["leads.verify", "leads.discover", "research.web"]),
    );
  });

  it("rejects services unavailable on the selected plan", () => {
    const result = configureServices(["ai.prompt-engineering"], "starter");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Service ai.prompt-engineering is not available on plan starter");
  });

  it("rejects services excluded by tenant allow/deny policy", () => {
    expect(configureServices(["marketing.content"], "pro", { allowedServiceIds: ["research.web"] }).valid).toBe(false);
    const denied = configureServices(["marketing.content"], "pro", { deniedServiceIds: ["marketing.content"] });
    expect(denied.valid).toBe(false);
    expect(denied.errors[0]).toContain("not authorized for this tenant");
  });

  it("rejects paused services", () => {
    const result = configureServices(["marketing.content"], "pro", { pausedServiceIds: ["marketing.content"] });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("is paused");
  });

  it("never silently marks planned services active", () => {
    const result = configureServices(["translation.multilingual"], "pro");
    const summary = summarizeServiceConfiguration(result, {
      configuredIntegrationServiceIds: ["translation.multilingual"],
      verifiedIntegrationServiceIds: ["translation.multilingual"],
    });
    expect(summary.plannedServiceIds).toContain("translation.multilingual");
    expect(summary.activeReadyServiceIds).not.toContain("translation.multilingual");
  });

  it("returns an error for unknown service IDs", () => {
    const result = configureServices(["not-a-service"], "enterprise");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Unknown service: not-a-service");
  });

  it("exposes stable service lookups", () => {
    expect(getServiceById("ai.prompt-engineering")?.agentId).toBe("prompt-engineering");
    expect(getServiceById("operations.backup-recovery")?.riskLevel).toBe("YELLOW");
  });
});
