import type { AgentDefinition } from "../../core/src/contracts";

export const defaultAgents: AgentDefinition[] = [
  {
    id: "business-knowledge",
    name: "Business Knowledge Agent",
    description: "Retrieves and validates business knowledge and source evidence.",
    capabilities: ["knowledge.search", "knowledge.validate"],
    riskLevel: "GREEN",
  },
  {
    id: "research",
    name: "Research Agent",
    description: "Researches authorized external and internal sources.",
    capabilities: ["research"],
    riskLevel: "GREEN",
  },
  {
    id: "execution",
    name: "Execution Agent",
    description: "Coordinates authorized actions through registered tools.",
    capabilities: ["tool.execute"],
    riskLevel: "YELLOW",
  },
  {
    id: "qa",
    name: "QA Agent",
    description: "Validates outputs, constraints and evidence before completion.",
    capabilities: ["qa.validate"],
    riskLevel: "GREEN",
  },
];
