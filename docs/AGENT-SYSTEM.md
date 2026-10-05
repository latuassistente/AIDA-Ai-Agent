# AIDA Agent System

## Orchestrator
Owns goal interpretation, planning, delegation, state transitions, approvals and final synthesis.

## Specialist agents

- Business Knowledge Agent
- Research Agent
- Lead/Prospecting Agent
- Audit Agent
- Marketing Agent
- Content Agent
- Web Agent
- 3D Agent
- Software Agent
- Communication/Omnichannel Agent
- Proposal/Quote Agent
- Sales Agent
- Voice Agent
- Appointment Agent
- Delivery Agent
- QA/Test Agent
- Customer Success Agent
- Analytics Agent

## Agent contract

Every agent must declare:
- identity
- capabilities
- required inputs
- allowed tools
- risk class
- output schema
- validation requirements
- escalation conditions

Agents return structured results, not uncontrolled prose.

## Autonomy levels

- **GREEN** — safe autonomous action.
- **YELLOW** — action requires human approval.
- **RED** — human takeover required.

The classification is evaluated per action, not only per agent.
