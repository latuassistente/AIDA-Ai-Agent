import type { Goal } from "./contracts";
import type { GoalPlanner, Plan } from "./orchestrator";

export class RuleBasedGoalPlanner implements GoalPlanner {
  async plan(goal: Goal): Promise<Plan> {
    const steps = [
      {
        id: "understand",
        agentId: "business-knowledge",
        objective: `Understand the business context required for: ${goal.objective}`,
        dependsOn: [],
        riskLevel: "GREEN" as const,
      },
      {
        id: "research",
        agentId: "research",
        objective: "Gather missing factual information and evidence.",
        dependsOn: ["understand"],
        riskLevel: "GREEN" as const,
      },
      {
        id: "execute",
        agentId: "execution",
        objective: "Execute the authorized work needed to achieve the goal.",
        dependsOn: ["research"],
        riskLevel: goal.riskLevel,
      },
      {
        id: "validate",
        agentId: "qa",
        objective: "Validate result, evidence and policy compliance.",
        dependsOn: ["execute"],
        riskLevel: "GREEN" as const,
      },
    ];

    return { goalId: goal.id, steps };
  }
}
