import { describe, expect, it } from "vitest";
import { GET, POST } from "./route";

describe("service configurator API", () => {
  it("returns the service catalog and supported plans", async () => {
    const response = GET();
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.plans).toEqual(expect.arrayContaining(["starter", "pro", "business", "enterprise"]));
    expect(payload.services).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "marketing.content" }),
    ]));
  });

  it("resolves dependencies and clearly reports that configuration is not persisted", async () => {
    const response = await POST(new Request("http://localhost/api/services/configure", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan: "business", selectedServiceIds: ["leads.export"] }),
    }));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.valid).toBe(true);
    expect(payload.services.map((service: { id: string }) => service.id)).toEqual(
      expect.arrayContaining(["leads.export", "leads.verify", "leads.discover", "research.web"]),
    );
    expect(payload.persisted).toBe(false);
    expect(payload.integrationsActivated).toBe(false);
  });

  it("rejects malformed requests", async () => {
    const response = await POST(new Request("http://localhost/api/services/configure", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan: "unknown", selectedServiceIds: [] }),
    }));
    expect(response.status).toBe(400);
  });

  it("returns unprocessable for selections unavailable on the plan", async () => {
    const response = await POST(new Request("http://localhost/api/services/configure", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan: "starter", selectedServiceIds: ["ai.prompt-engineering"] }),
    }));
    const payload = await response.json();
    expect(response.status).toBe(422);
    expect(payload.valid).toBe(false);
    expect(payload.errors.length).toBeGreaterThan(0);
  });
});
