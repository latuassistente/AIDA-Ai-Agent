import type { Goal } from "./contracts";
import type { AidaEvent, EventBus } from "./events";

export interface GoalStore {
  create(goal: Goal): Promise<void>;
  get(id: string, tenantId: string): Promise<Goal | undefined>;
  update(goal: Goal): Promise<void>;
}

export interface GoalIdGenerator {
  next(): string;
}

export interface GoalServiceDependencies {
  store: GoalStore;
  events: EventBus;
  ids: GoalIdGenerator;
  now?: () => string;
}

export class GoalService {
  private readonly now: () => string;

  constructor(private readonly deps: GoalServiceDependencies) {
    this.now = deps.now ?? (() => new Date().toISOString());
  }

  async create(input: Omit<Goal, "id" | "status">): Promise<Goal> {
    if (!input.tenantId.trim()) throw new Error("tenantId is required.");
    if (!input.objective.trim()) throw new Error("objective is required.");
    if (input.successCriteria.length === 0) throw new Error("At least one success criterion is required.");

    const goal: Goal = {
      ...input,
      id: this.deps.ids.next(),
      status: "DRAFT",
    };
    await this.deps.store.create(goal);
    const event: AidaEvent = {
      id: this.deps.ids.next(),
      tenantId: goal.tenantId,
      type: "GOAL_CREATED",
      aggregateId: goal.id,
      payload: { objective: goal.objective, riskLevel: goal.riskLevel },
      occurredAt: this.now(),
    };
    await this.deps.events.publish(event);
    return goal;
  }

  async get(id: string, tenantId: string): Promise<Goal | undefined> {
    if (!tenantId.trim()) throw new Error("tenantId is required.");
    return this.deps.store.get(id, tenantId);
  }

  async transition(id: string, tenantId: string, status: Goal["status"], nextAction?: string): Promise<Goal> {
    const current = await this.deps.store.get(id, tenantId);
    if (!current) throw new Error("Goal not found.");
    const allowed: Record<Goal["status"], Goal["status"][]> = {
      DRAFT: ["PLANNED", "CANCELLED"],
      PLANNED: ["RUNNING", "CANCELLED"],
      RUNNING: ["WAITING_APPROVAL", "WAITING_HUMAN", "COMPLETED", "FAILED", "CANCELLED"],
      WAITING_APPROVAL: ["PLANNED", "RUNNING", "CANCELLED"],
      WAITING_HUMAN: ["PLANNED", "RUNNING", "CANCELLED"],
      COMPLETED: [],
      FAILED: ["PLANNED", "CANCELLED"],
      CANCELLED: [],
    };
    if (!allowed[current.status].includes(status)) {
      throw new Error(`Invalid goal transition: ${current.status} -> ${status}`);
    }
    const updated: Goal = {
      ...current,
      status,
      ...(nextAction === undefined ? {} : { nextAction }),
    };
    await this.deps.store.update(updated);
    return updated;
  }
}

export class InMemoryGoalStore implements GoalStore {
  private readonly goals = new Map<string, Goal>();

  async create(goal: Goal): Promise<void> {
    const key = `${goal.tenantId}:${goal.id}`;
    if (this.goals.has(key)) throw new Error("Goal already exists.");
    this.goals.set(key, { ...goal });
  }

  async get(id: string, tenantId: string): Promise<Goal | undefined> {
    const goal = this.goals.get(`${tenantId}:${id}`);
    return goal ? { ...goal } : undefined;
  }

  async update(goal: Goal): Promise<void> {
    const key = `${goal.tenantId}:${goal.id}`;
    if (!this.goals.has(key)) throw new Error("Goal not found.");
    this.goals.set(key, { ...goal });
  }
}
