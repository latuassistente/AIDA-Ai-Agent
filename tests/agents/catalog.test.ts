import { describe, expect, it } from "vitest";
import { InMemoryAgentRegistry } from "../../packages/core/src/agent-registry";
import { createDefaultAgentRegistry, defaultAgents, registerDefaultAgents } from "../../packages/agents/src";

describe("AIDA default agent catalog", () => {
  it("preserves stable IDs for existing core agents and adds specialists without duplicate IDs", () => {
    const ids = defaultAgents.map((agent) => agent.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("business-knowledge");
    expect(ids).toContain("research");
    expect(ids).toContain("execution");
    expect(ids).toContain("quality-assurance");
    expect(ids).toContain("find");
    expect(ids).toContain("booking");
    expect(ids).toContain("document");
    expect(ids).toContain("legal-support");
    expect(ids).toContain("web");
    expect(ids.length).toBe(38);
    expect(defaultAgents.find((agent) => agent.id === "lead-prospecting")?.name).toBe("B2B Lead Extractor AI");
    expect(defaultAgents.find((agent) => agent.id === "document")?.name).toBe("PC File Manager AI");
    expect(defaultAgents.find((agent) => agent.id === "omnichannel-communications")?.name).toBe("Email Campaign AI");
    expect(defaultAgents.find((agent) => agent.id === "lead-prospecting")?.capabilities).toEqual(
      expect.arrayContaining(["leads.enrich-mobile", "leads.enrich-email", "leads.normalize", "leads.deduplicate"]),
    );
    expect(defaultAgents.find((agent) => agent.id === "document")?.capabilities).toEqual(
      expect.arrayContaining(["files.keyword-search", "files.move-approved", "files.scoped-access-check"]),
    );
    expect(defaultAgents.find((agent) => agent.id === "omnichannel-communications")?.capabilities).toEqual(
      expect.arrayContaining(["communications.email-html-render", "communications.recipient-authorization-check", "communications.send-approved"]),
    );
    expect(ids.length).toBeGreaterThanOrEqual(25);
  });

  it("creates a runtime registry containing the complete default roster", () => {
    const registry = createDefaultAgentRegistry();
    expect(registry.list()).toHaveLength(defaultAgents.length);
    for (const agent of defaultAgents) {
      expect(registry.get(agent.id)).toEqual(agent);
    }
  });

  it("replaces an existing agent with the same ID and adds the missing specialists", () => {
    const registry = new InMemoryAgentRegistry();
    registry.register({
      id: "research",
      name: "Old Research Agent",
      description: "Old definition",
      capabilities: ["research"],
      riskLevel: "GREEN",
    });
    registerDefaultAgents(registry);
    expect(registry.get("research")?.name).toBe("Research Agent");
    expect(registry.list()).toHaveLength(defaultAgents.length);
  });
});
