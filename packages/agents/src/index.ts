export * from "./catalog";

import { InMemoryAgentRegistry } from "../../core/src/agent-registry";
import { registerDefaultAgents } from "./catalog";

/** Creates a runtime registry with the full default AIDA specialist roster. */
export function createDefaultAgentRegistry(): InMemoryAgentRegistry {
  const registry = new InMemoryAgentRegistry();
  registerDefaultAgents(registry);
  return registry;
}
