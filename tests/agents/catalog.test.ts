import { describe, expect, it } from "vitest";
import { InMemoryAgentRegistry } from "../../packages/core/src/agent-registry";
import { defaultAgents, registerDefaultAgents } from "../../packages/agents/src";

describe("AIDA default agent catalog", () => {
  it("keeps stable identities for existing core agents and adds specialists without duplicate IDs", () => {
    const ids = defaultAgents.map((agent) => agent.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("business-knowledge");
    expect(ids).toContain("research");
    expect(ids).toContain("execution");
    expect(ids).toContain("quality-assurance");
    expect(ids.length).toBeGreaterThanOrEqual(25);
  });

  it("registers the complete default roster in the runtime registry", () => {
    const registry = new InMemoryAgentRegistry();
    registerDefaultAgents(registry);
    expect(registry.list()).toHaveLength(defaultAgents.length);
    for (const agent of defaultAgents) {
      expect(registry.get(agent.id)).toEqual(agent);
    }
  });

  it("fails explicitly rather than silently replacing an already registered agent", () => {
    const registry = new InMemoryAgentRegistry();
    registry.register(defaultAgents[0]!);
    expect(() => registerDefaultAgents(registry)).toThrow(
      `Agent already registered: ${defaultAgents[0]!.id}`,
    );
  });
});
