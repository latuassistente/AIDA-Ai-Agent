import type { RiskLevel } from "./contracts";

export interface ToolContext {
  tenantId: string;
  actor: string;
  goalId?: string;
  projectId?: string;
}

export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  id: string;
  description: string;
  riskLevel: RiskLevel;
  execute(input: TInput, context: ToolContext): Promise<TOutput>;
}

export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.id)) throw new Error(`Tool already registered: ${tool.id}`);
    this.tools.set(tool.id, tool);
  }

  get(id: string): ToolDefinition | undefined {
    return this.tools.get(id);
  }

  list(): ToolDefinition[] {
    return [...this.tools.values()];
  }
}
