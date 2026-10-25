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
    expect(ids).toContain("web");
    expect(ids.length).toBe(31);
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
