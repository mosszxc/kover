# CLAUDE.md

Short, dense. Lists > prose.

---

## FIX #N — READ FIRST

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Got "fix #N"?                                              │
│                                                             │
│  [PHASE 1] gh issue view N           ← read issue           │
│  [PHASE 2] ./scripts/fix N           ← creates worktree     │
│            cd .worktrees/issue-N     ← WORK ONLY HERE       │
│  [PHASE 2.5] PRE-CODE ANALYSIS      ← MANDATORY             │
│            → see section below                              │
│  [PHASE 3] write code, build, lint                          │
│  [PHASE 4] ./scripts/ship            ← EVERYTHING ELSE AUTO │
│  [PHASE 5] VERIFY FINALIZATION:                             │
│            gh pr view --json state   ← must be MERGED       │
│            gh issue view N --json state ← must be CLOSED    │
│            If not — merge and close manually:               │
│            gh pr merge --squash && gh issue close N         │
│                                                             │
│  OUTPUT PHASE: "[PHASE N] what I'm doing..."                │
│                                                             │
│  DO NOT git commit/push/pr manually                         │
│  DO NOT work in the main directory                          │
│  DO NOT finish without PHASE 5                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## CONFLICT — AI-ASSISTED MERGE

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  If ship returned exit 2 + "CONFLICT_DETECTED":             │
│                                                             │
│  1. Read /tmp/ship_conflict_<N>/<file>.ours                 │
│     → your changes                                          │
│                                                             │
│  2. Read /tmp/ship_conflict_<N>/<file>.theirs               │
│     → changes from develop                                  │
│                                                             │
│  3. Analyze intent of both sides                            │
│                                                             │
│  4. Edit the conflicting file                               │
│     → merge logic from both sides                           │
│                                                             │
│  5. ./scripts/ship --continue                               │
│                                                             │
│  DO NOT git add/rebase manually                             │
│  DO NOT use union merge (creates duplicates)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## PHASE 2.5 — PRE-CODE ANALYSIS

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  MANDATORY before writing code.                              │
│  Skip ONLY for labels: docs, polish.                        │
│  ship WILL BLOCK without .analysis.md in worktree.          │
│                                                             │
│  1. WALKTHROUGH: walk through user journey step by step     │
│     "Clicked → saw → expected"                              │
│     If "saw" ≠ "expected" — it's a bug, resolve early.      │
│                                                             │
│  2. PATTERNS: find 1-2 analogous places in code.            │
│     Run through walkthrough from #1 — is pattern correct?   │
│     • Yes → use it.                                         │
│     • No → suggest the correct variant.                     │
│                                                             │
│  3. VALIDATION: issue asks for X, but walkthrough shows     │
│     Y is needed? Tell user, don't silently do X.            │
│                                                             │
│  WRITE analysis in .analysis.md (5-10 lines).               │
│  Show user. Then code immediately — DON'T ASK "continue?"   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## SINGLE SOURCE OF TRUTH

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  DOCUMENT HIERARCHY:                                        │
│                                                             │
│  engineering/tech-spec.md  ← SINGLE source for:             │
│    • DB schemas (tables, fields, types)                     │
│    • API contracts (endpoints, request/response)            │
│    • Algorithms                                             │
│                                                             │
│  design/roadmap.md  ← WHAT and WHEN:                        │
│    • Task order, iterations                                │
│    • Links to tech spec (NO schema duplication)            │
│                                                             │
│  engineering/architecture.md  ← HOW to write code:          │
│    • Architecture (api → domains → pipelines)              │
│    • Current state and tech debt                           │
│    • Pre-ship checklist                                    │
│                                                             │
│  Issues  ← Concrete task:                                   │
│    • References tech spec for details                      │
│    • References roadmap for context                        │
│                                                             │
│  Priority: tech-spec > roadmap > issues                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## MIGRATIONS + CODE = ONE PR

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  RULE: migration + code = ONE PR (atomic)                   │
│                                                             │
│  When changing DB schema:                                    │
│  1. Update engineering/tech-spec.md (source of truth)       │
│  2. Create migration (apply_migration)                      │
│  3. Update domains/*/repository.py (db.table() calls)      │
│  4. Update domains/*/schemas.py (Pydantic models)          │
│                                                             │
│  MIGRATION TEMPLATE:                                        │
│  1. CREATE TABLE                                            │
│  2. ALTER TABLE ... ENABLE ROW LEVEL SECURITY               │
│  3. CREATE POLICY (anon + service_role)                     │
│  4. GRANT TO anon, authenticated, service_role              │
│                                                             │
│  Without GRANT → "permission denied" (42501)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## SUPABASE: TOKEN ECONOMY

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  list_tables = ~20k tokens (full schema of all tables)      │
│                                                             │
│  DO NOT USE list_tables / generate_typescript_types          │
│  without absolute necessity                                 │
│                                                             │
│  USE execute_sql:                                           │
│                                                             │
│  List tables (~300 tokens):                                 │
│  SELECT table_name FROM information_schema.tables           │
│  WHERE table_schema = 'public';                             │
│                                                             │
│  Schema of one table (~200 tokens):                         │
│  SELECT column_name, data_type, is_nullable                 │
│  FROM information_schema.columns                            │
│  WHERE table_name = 'xxx';                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Project

**Kover** — Decision Engine Platform. Monorepo: API (FastAPI) + Web (React).

## Structure

```
kover/
├── apps/
│   ├── api/           # Python backend (FastAPI + Temporal)
│   │   └── src/
│   │       ├── api/       # HTTP routers
│   │       ├── domains/   # Business logic (service + repository + schemas)
│   │       ├── pipelines/ # Orchestration (Temporal workflows)
│   │       ├── core/      # Config, dependencies
│   │       ├── clients/   # External API clients
│   │       └── workers/   # Temporal workers
│   └── web/           # React frontend (Vite + Tailwind)
├── packages/
│   ├── types/         # Shared TypeScript types
│   └── shared/        # Shared utilities
├── scripts/
│   ├── fix            # Start working on issue
│   ├── ship           # Finish: commit, PR, merge
│   ├── batch-fix      # Batch issue processing
│   └── prune          # Cleanup merged worktrees
├── turbo.json
└── pnpm-workspace.yaml
```

## Quick Start

```bash
pnpm install
pnpm dev          # API + Web in parallel
pnpm dev:api      # localhost:10000
pnpm dev:web      # localhost:5173
```

## Stack

### API (apps/api)

```
Python 3.11+
├── FastAPI
├── Temporal (orchestration)
├── Supabase (DB)
└── uv (package manager)
```

### Web (apps/web)

```
Vite + React 19 + TypeScript
├── Tailwind v4
├── Shadcn/ui
├── TanStack Query
├── React Router
└── Supabase client
```

## Env Variables

### API (apps/api/.env)

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
OPENAI_API_KEY=
```

### Web (apps/web/.env)

```
VITE_API_URL=http://localhost:10000
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | API + Web in parallel |
| `pnpm dev:api` | API on :10000 |
| `pnpm dev:web` | Web on :5173 |
| `pnpm build` | Build all (turbo) |
| `pnpm lint` | Lint all (turbo) |
| `pnpm clean` | Clean all |

## Conventions

1. **TypeScript strict mode** everywhere
2. **TanStack Query** for all API calls
3. **Tailwind v4** — no inline styles
4. **Dark mode first**
5. **pnpm** — not npm/yarn
6. **Shadcn components** — don't reinvent

## Labels

| Label | Description |
|-------|-------------|
| `P1` | Priority 1 — Critical path |
| `P2` | Priority 2 — Important |
| `P3` | Priority 3 — Nice to have |
| `db` | Database/migrations |
| `api` | Backend/API issues |
| `web` | Frontend/Web issues |
| `ui` | Frontend/UI |
| `e2e` | E2E testing issues |
| `infra` | Infrastructure |
| `bug` | Something isn't working |
| `enhancement` | New feature or request |
| `spike` | Research/validation task |
| `polish` | Code quality, hardening |
| `epic` | Epic issue with sub-issues |
| `docs` | Documentation |

## Anti-Patterns

```typescript
// NO inline styles
<div style={{backgroundColor: '#000'}}>
// YES Tailwind
<div className="bg-black">

// NO fetch directly
const data = await fetch('/api/...')
// YES TanStack Query
const { data } = useQuery({ queryKey: ['key'], queryFn: fetchFn })

// NO hardcoded URLs
fetch('https://api.example.com/...')
// YES from env
fetch(`${import.meta.env.VITE_API_URL}/...`)
```
