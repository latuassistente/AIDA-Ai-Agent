# Local Development

## Prerequisites

- Node.js 22+
- pnpm 10+
- PostgreSQL for persistence-backed development

## Install

From the repository root:

```bash
pnpm install
cp .env.example .env
```

Set `DATABASE_URL` in `.env` before running Prisma commands. Never commit credentials or production secrets.

## Run the initial dashboard

```bash
pnpm dev:web
```

The first dashboard is a status/control-center shell. It does not yet send messages, call customers, publish websites or run production workflows.

## Database

```bash
pnpm db:validate
pnpm db:generate
pnpm db:migrate:dev
```

A PostgreSQL instance must be running and reachable before migrations can be applied.

## Checks

```bash
pnpm typecheck
pnpm test
```

The GitHub Actions workflow runs Prisma schema validation, client generation, typechecking and tests on pushes to `main` and pull requests.

## Production prerequisites

Before deploying or enabling real customer actions, implement and verify authentication, tenant/role authorization, secret management, migrations, backups, retention controls, provider OAuth/API credentials, rate limits, and channel-specific consent/authorization checks.
