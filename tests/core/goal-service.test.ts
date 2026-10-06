import { describe, expect, it } from "vitest";
import { GoalService, InMemoryGoalStore } from "../../packages/core/src/goal-service";
import { InMemoryEventBus } from "../../packages/core/src/events";

describe("GoalService", () => {
  it("creates tenant-scoped goals and emits an event", async () => {
    const store = new InMemoryGoalStore();
    const events = new InMemoryEventBus();
    const seen: string[] = [];
    events.subscribe("GOAL_CREATED", async (event) => {
      seen.push(event.aggregateId);
    });
    let nextId = 0;
    const service = new GoalService({
      store,
      events,
      ids: { next: () => `id-${++nextId}` },
      now: () => "2026-10-06T12:00:00.000Z",
    });

    const goal = await service.create({
      tenantId: "tenant-a",
      objective: "Qualify incoming leads",
      successCriteria: ["Every lead has a qualification status"],
      constraints: ["Do not contact without authorization"],
      riskLevel: "YELLOW",
    });

    expect(goal.status).toBe("DRAFT");
    expect(await service.get(goal.id, "tenant-a")).toEqual(goal);
    expect(await service.get(goal.id, "tenant-b")).toBeUndefined();
    expect(seen).toEqual([goal.id]);
  });

  it("rejects invalid state transitions", async () => {
    const store = new InMemoryGoalStore();
    const service = new GoalService({
      store,
      events: new InMemoryEventBus(),
      ids: { next: () => "goal-1" },
    });
    const goal = await service.create({
      tenantId: "tenant-a",
      objective: "Prepare a project plan",
      successCriteria: ["Plan validated"],
      constraints: [],
      riskLevel: "GREEN",
    });

    await expect(service.transition(goal.id, "tenant-a", "COMPLETED")).rejects.toThrow(
      "Invalid goal transition",
    );
  });
});
