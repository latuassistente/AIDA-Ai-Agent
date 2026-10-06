import type { PrismaClient } from "@prisma/client";
import type { Goal } from "../../core/src/contracts";
import type { GoalStore } from "../../core/src/goal-service";

type DbGoal = {
  id: string;
  tenantId: string;
  objective: string;
  successCriteria: unknown;
  constraints: unknown;
  status: string;
  riskLevel: string;
  nextAction: string | null;
  deadline: Date | null;
};

function toDomain(row: DbGoal): Goal {
  return {
    id: row.id,
    tenantId: row.tenantId,
    objective: row.objective,
    successCriteria: Array.isArray(row.successCriteria) ? row.successCriteria.filter((v): v is string => typeof v === "string") : [],
    constraints: Array.isArray(row.constraints) ? row.constraints.filter((v): v is string => typeof v === "string") : [],
    status: row.status as Goal["status"],
    riskLevel: row.riskLevel as Goal["riskLevel"],
    ...(row.nextAction === null ? {} : { nextAction: row.nextAction }),
    ...(row.deadline === null ? {} : { deadline: row.deadline.toISOString() }),
  };
}

export class PrismaGoalStore implements GoalStore {
  constructor(private readonly db: PrismaClient) {}

  async create(goal: Goal): Promise<void> {
    await this.db.goal.create({
      data: {
        id: goal.id,
        tenantId: goal.tenantId,
        objective: goal.objective,
        successCriteria: goal.successCriteria,
        constraints: goal.constraints,
        status: goal.status,
        riskLevel: goal.riskLevel,
        nextAction: goal.nextAction ?? null,
        deadline: goal.deadline ? new Date(goal.deadline) : null,
      },
    });
  }

  async get(id: string, tenantId: string): Promise<Goal | undefined> {
    const row = await this.db.goal.findFirst({ where: { id, tenantId } });
    return row ? toDomain(row) : undefined;
  }

  async update(goal: Goal): Promise<void> {
    const result = await this.db.goal.updateMany({
      where: { id: goal.id, tenantId: goal.tenantId },
      data: {
        objective: goal.objective,
        successCriteria: goal.successCriteria,
        constraints: goal.constraints,
        status: goal.status,
        riskLevel: goal.riskLevel,
        nextAction: goal.nextAction ?? null,
        deadline: goal.deadline ? new Date(goal.deadline) : null,
      },
    });
    if (result.count !== 1) throw new Error("Goal not found.");
  }
}
