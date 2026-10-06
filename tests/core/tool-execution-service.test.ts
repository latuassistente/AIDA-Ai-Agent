import { describe, expect, it } from "vitest";
import { ToolExecutionService, ToolRegistry } from "../../packages/core/src";
import { InMemoryAuditSink, PolicyEngine } from "../../packages/guardrails/src";

describe("ToolExecutionService", () => {
  it("does not execute tools when no policy explicitly authorizes them", async () => {
    const tools = new ToolRegistry();
    let executed = false;
    tools.register({
      id: "message.send",
      description: "Send a message",
      riskLevel: "GREEN",
      execute: async () => {
        executed = true;
        return { sent: true };
      },
    });
    let id = 0;
    const audit = new InMemoryAuditSink();
    const service = new ToolExecutionService(
      tools,
      new PolicyEngine([]),
      audit,
      { next: () => `audit-${++id}` },
      () => "2026-10-06T12:00:00.000Z",
    );

    const result = await service.execute("message.send", {}, { tenantId: "tenant-a", actor: "agent" });
    expect(result.requiresHuman).toBe(true);
    expect(executed).toBe(false);
    expect(audit.events[0]?.decision).toBe("HUMAN_HANDOFF");
  });

  it("requires approval for yellow-risk tools without executing them", async () => {
    const tools = new ToolRegistry();
    let executed = false;
    tools.register({
      id: "proposal.discount",
      description: "Apply exceptional discount",
      riskLevel: "YELLOW",
      execute: async () => {
        executed = true;
        return { applied: true };
      },
    });
    const policy = new PolicyEngine([{
      matches: () => true,
      evaluate: () => ({ allowed: true, requiresApproval: false, requiresHuman: false, reasons: [] }),
    }]);
    const service = new ToolExecutionService(tools, policy, new InMemoryAuditSink(), { next: () => "audit-1" });

    const result = await service.execute("proposal.discount", {}, { tenantId: "tenant-a", actor: "agent" });
    expect(result.requiresApproval).toBe(true);
    expect(executed).toBe(false);
  });
});
