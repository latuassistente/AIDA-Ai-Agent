# AIDA Architecture

## 1. High-level flow

User/Customer → Interface → Orchestrator → Goal Planner → Agent Graph → Tools/Providers → Validation → Action/Approval → Project Brain → KPI/Next Action.

The Orchestrator owns the lifecycle of a goal. Specialized agents do not independently redefine the goal.

## 2. Core layers

1. **Experience** — minimal mode and advanced/pro mode.
2. **Application** — goals, workflows, approvals, conversations and projects.
3. **Agent runtime** — orchestrator, planner, specialist agents and tool execution.
4. **Domain** — customers, projects, offers, appointments, knowledge, communications.
5. **Integration** — email, WhatsApp, SMS, Telegram, Messenger, Instagram, TikTok, calendar, voice and external services.
6. **Persistence** — PostgreSQL, object storage, queues/events and audit log.

## 3. Goal-oriented execution

Every goal has:
- objective
- success criteria
- constraints
- authorized actions
- risk level
- deadline
- current state
- next action
- evidence
- owner/human escalation policy

A task is an implementation step inside a goal, never the product's primary abstraction.

## 4. Multi-tenancy

All business data is tenant-scoped. Authorization is evaluated before tool execution. Secrets are isolated and encrypted. Cross-customer data access is forbidden by default.

## 5. Integration principle

External systems are connected through adapters. AIDA must use official APIs/authorized integrations and must expose capability limitations rather than bypass platform controls.
