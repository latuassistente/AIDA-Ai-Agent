import type { AgentResult } from "./contracts";
import type { ToolContext, ToolRegistry } from "./tool-registry";
import type { PolicyEngine, AuditSink, AuditEvent } from "../../guardrails/src/index";

export interface RuntimeIdGenerator {
  next(): string;
}

export class ToolExecutionService {
  constructor(
    private readonly tools: ToolRegistry,
    private readonly policies: PolicyEngine,
    private readonly audit: AuditSink,
    private readonly ids: RuntimeIdGenerator,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async execute<TInput, TOutput>(
    toolId: string,
    input: TInput,
    context: ToolContext,
  ): Promise<AgentResult<TOutput>> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      await this.writeAudit(context, toolId, "HUMAN_HANDOFF");
      return {
        ok: false,
        riskLevel: "RED",
        requiresApproval: false,
        requiresHuman: true,
        errors: [`Tool is not registered: ${toolId}`],
      };
    }

    const decision = this.policies.evaluate({
      tenantId: context.tenantId,
      actor: context.actor,
      action: tool.id,
      ...(context.projectId ? { target: context.projectId } : {}),
      payload: input,
      riskLevel: tool.riskLevel,
    });

    if (decision.requiresHuman || !decision.allowed) {
      await this.writeAudit(context, tool.id, "HUMAN_HANDOFF");
      return {
        ok: false,
        riskLevel: "RED",
        requiresApproval: decision.requiresApproval,
        requiresHuman: true,
        errors: decision.reasons.length ? decision.reasons : ["Policy denied execution."],
      };
    }

    if (tool.riskLevel === "RED") {
      await this.writeAudit(context, tool.id, "HUMAN_HANDOFF");
      return {
        ok: false,
        riskLevel: "RED",
        requiresApproval: false,
        requiresHuman: true,
        errors: ["RED-risk actions require a human operator."],
      };
    }

    if (decision.requiresApproval || tool.riskLevel === "YELLOW") {
      await this.writeAudit(context, tool.id, "APPROVAL_REQUIRED");
      return {
        ok: true,
        riskLevel: "YELLOW",
        requiresApproval: true,
        requiresHuman: false,
        nextAction: `Approval required for tool: ${tool.id}`,
      };
    }

    try {
      const output = await tool.execute(input, context) as TOutput;
      await this.writeAudit(context, tool.id, "ALLOWED");
      return {
        ok: true,
        data: output,
        riskLevel: tool.riskLevel,
        requiresApproval: false,
        requiresHuman: false,
      };
    } catch (error) {
      await this.writeAudit(context, tool.id, "BLOCKED");
      return {
        ok: false,
        riskLevel: "RED",
        requiresApproval: false,
        requiresHuman: true,
        errors: [error instanceof Error ? error.message : "Tool execution failed."],
      };
    }
  }

  private async writeAudit(
    context: ToolContext,
    action: string,
    decision: AuditEvent["decision"],
  ): Promise<void> {
    await this.audit.append({
      id: this.ids.next(),
      tenantId: context.tenantId,
      actor: context.actor,
      action,
      decision,
      createdAt: this.now(),
    });
  }
}
