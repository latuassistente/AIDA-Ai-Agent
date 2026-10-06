import type { RiskLevel } from "../../core/src/contracts";
import type { ActionRequest, PolicyDecision } from "./index";

export interface PolicyRule {
  matches(action: ActionRequest): boolean;
  evaluate(action: ActionRequest): PolicyDecision;
}

export class PolicyEngine {
  constructor(private readonly rules: PolicyRule[]) {}

  evaluate(action: ActionRequest): PolicyDecision {
    const matched = this.rules.filter((rule) => rule.matches(action));

    if (matched.length === 0) {
      return {
        allowed: false,
        requiresApproval: false,
        requiresHuman: true,
        reasons: ["No explicit policy authorizes this action."],
      };
    }

    return matched.reduce<PolicyDecision>(
      (decision, rule) => {
        const next = rule.evaluate(action);
        return {
          allowed: decision.allowed && next.allowed,
          requiresApproval: decision.requiresApproval || next.requiresApproval,
          requiresHuman: decision.requiresHuman || next.requiresHuman,
          reasons: [...decision.reasons, ...next.reasons],
        };
      },
      { allowed: true, requiresApproval: false, requiresHuman: false, reasons: [] },
    );
  }
}

export function highestRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  const order: Record<RiskLevel, number> = { GREEN: 0, YELLOW: 1, RED: 2 };
  return order[a] >= order[b] ? a : b;
}
