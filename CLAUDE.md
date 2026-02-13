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
│  SPEC_маршруты_v1.md  ← Product spec:                       │
│    • Data model (types, fields, relationships)              │
│    • Business rules                                        │
│    • User stories                                          │
│                                                             │
│  design/roadmap.md  ← WHAT and WHEN:                        │
│    • Task order, iterations                                │
│    • Links to spec (NO type duplication)                   │
│                                                             │
│  design-system/kover/MASTER.md  ← HOW it looks:             │
│    • Colors, typography, spacing                           │
│    • Component specs, accessibility                        │
│    • Print layout rules                                    │
│                                                             │
│  Issues  ← Concrete task:                                   │
│    • References spec for details                           │
│    • References roadmap for context                        │
│                                                             │
│  Priority: spec > roadmap > issues                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Project

**Kover** — Route Management System. React SPA + localStorage.

## Structure

```
kover/
├── apps/
│   └── web/           # React frontend (Vite + Tailwind)
│       └── src/
│           ├── components/  # UI components
│           ├── pages/       # Route pages
│           ├── store/       # Zustand stores
│           ├── types/       # TypeScript interfaces
│           ├── data/        # Seed data (143 clients)
│           └── lib/         # Utilities
├── scripts/
│   ├── fix            # Start working on issue
│   ├── ship           # Finish: commit, PR, merge
│   ├── batch-fix      # Batch issue processing
│   └── prune          # Cleanup merged worktrees
├── design/
│   └── roadmap.md     # Iterations & tasks
├── design-system/
│   └── kover/MASTER.md # Colors, typography, components
├── turbo.json
└── pnpm-workspace.yaml
```

## Quick Start

```bash
pnpm install
pnpm dev:web      # localhost:5173
```

## Stack

```
Vite + React 19 + TypeScript
├── Tailwind v4
├── Shadcn/ui
├── Zustand + persist (localStorage)
├── React Router
├── @dnd-kit (drag & drop)
└── Lucide React (icons)
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev:web` | Web on :5173 |
| `pnpm build` | Build |
| `pnpm lint` | Lint |

## Conventions

1. **TypeScript strict mode** everywhere
2. **Zustand** for state (localStorage persistence)
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
| `data` | Data model/store |
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

// NO direct localStorage
localStorage.setItem('clients', JSON.stringify(data))
// YES Zustand persist
const useStore = create(persist((set) => ({ ... }), { name: 'kover-store' }))
```
