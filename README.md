# Kover

Decision Engine Platform. Monorepo: API (FastAPI) + Web (React).

## Quick Start

```bash
pnpm install
pnpm dev          # API + Web in parallel
pnpm dev:api      # localhost:10000
pnpm dev:web      # localhost:5173
```

## Stack

- **API:** Python 3.11+, FastAPI, Temporal, Supabase, uv
- **Web:** Vite, React 19, TypeScript, Tailwind v4, shadcn/ui, TanStack Query
- **CI:** GitHub Actions (deploy-production, deploy-staging, lint-migrations, schema-validation)
