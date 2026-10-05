# Security and Guardrails

Security is a first-class subsystem.

## Controls

- tenant isolation
- RBAC/least privilege
- encrypted secrets
- scoped OAuth tokens
- consent and authorization checks
- immutable audit trail
- tool allowlists
- action risk scoring
- approval gates
- rate limits
- idempotency keys
- input/output validation
- prompt-injection defenses
- sensitive-data minimization
- retention/deletion policies
- human escalation

## Critical rule

An LLM may propose an action; policy and domain validation decide whether that action can execute.

External side effects must be explicit, authorized and logged.
