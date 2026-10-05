import type { AgentDefinition, AgentResult, Goal } from "./contracts";

export interface AgentRegistry {
  get(agentId: string): AgentDefinition | undefined;
}

export interface AgentExecutor {
  execute<TInput, TOutput>(
    agent: AgentDefinition,
    input: TInput,
  ): Promise<AgentResult<TOutput>>;
}

export interface GoalPlanner {
  plan(goal: Goal): Promise<Plan>;
}

export interface PlanStep {
  id: string;
  agentId: string;
  objective: string;
  dependsOn: string[];
  riskLevel: AgentDefinition["riskLevel"];
}

export interface Plan {
  goalId: string;
  steps: PlanStep[];
}

export interface OrchestratorDependencies {
  planner: GoalPlanner;
  registry: AgentRegistry;
  executor: AgentExecutor;
}

export class Orchestrator {
  constructor(private readonly deps: OrchestratorDependencies) {}

  async run(goal: Goal): Promise<AgentResult<{ goalId: string; completedSteps: string[] }>> {
    const plan = await this.deps.planner.plan(goal);
    const completedSteps: string[] = [];

    for (const step of plan.steps) {
      const unmet = step.dependsOn.filter((id) => !completedSteps.includes(id));
      if (unmet.length > 0) {
        return {
          ok: false,
          riskLevel: "RED",
          requiresApproval: false,
          requiresHuman: true,
          errors: [`Step ${step.id} has unmet dependencies: ${unmet.join(", ")}`],
        };
      }

      const agent = this.deps.registry.get(step.agentId);
      if (!agent) {
        return {
          ok: false,
          riskLevel: "RED",
          requiresApproval: false,
          requiresHuman: true,
          errors: [`Agent not registered: ${step.agentId}`],
        };
      }

      const result = await this.deps.executor.execute(agent, {
        goal,
        step,
      });

      if (!result.ok || result.requiresHuman) {
        return {
          ok: false,
          riskLevel: result.riskLevel,
          requiresApproval: result.requiresApproval,
          requiresHuman: result.requiresHuman,
          errors: result.errors ?? [`Execution stopped at step ${step.id}`],
        };
      }

      if (result.requiresApproval) {
        return {
          ok: true,
          riskLevel: result.riskLevel,
          requiresApproval: true,
          requiresHuman: false,
          nextAction: `Approve step ${step.id}`,
          data: { goalId: goal.id, completedSteps },
        };
      }

      completedSteps.push(step.id);
    }

    return {
      ok: true,
      riskLevel: "GREEN",
      requiresApproval: false,
      requiresHuman: false,
      data: { goalId: goal.id, completedSteps },
    };
  }
}
