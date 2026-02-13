# VIBE SYSTEM v5

Система для быстрой разработки с AI-агентами. Полная автоматизация от issue до merge.

---

## Быстрый старт

```bash
fix #123                       # Полный цикл до merge
./scripts/batch-fix --limit 5  # Пакетная обработка issues
./scripts/prune                # Очистка merged worktrees
```

---

## Философия

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  1. Одна команда — fix #123 — всё остальное автоматически  │
│  2. Issue = источник правды + анализ codebase              │
│  3. Агент сам анализирует, кодит, ship, merge              │
│  4. Worktrees изолируют агентов друг от друга              │
│  5. Конфликты решает агент (AI-assisted merge)             │
│  6. "Выполнено" = PR merged + issue closed                 │
│  7. Качество > скорость: PHASE 2.5 обязателен             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Режимы работы

### FULL AUTO MODE (по умолчанию)

```
User: "fix #123"

Agent: [PHASE 1] Читаю issue...
       [PHASE 2] Создаю worktree...
       [PHASE 2.5] Анализирую: walkthrough → паттерны → валидация
       [PHASE 3] Пишу код... Build ✓ Lint ✓
       [PHASE 4] Ship → PR → merge
       [PHASE 5] Финализация

       ✅ #123 completed

       PR: https://github.com/.../pull/87
       Status: merged → develop
       Issue #123: closed
```

Агент показывает анализ (PHASE 2.5), затем сразу пишет код без ожидания подтверждения.

### ARCHITECT MODE (по триггерам)

Включается словами: "спланируй", "предложи варианты", "как лучше сделать?"

```
User: "спланируй рефакторинг авторизации #78"

Agent: [исследует код]

       План:
       1. AuthContext
       2. Cookies вместо localStorage
       3. Обновить 8 файлов

       Делаем?

User: "да"

Agent: [fix #78 → ... → merge]
       ✅ #78 completed
```

### BATCH MODE (автономная обработка)

```bash
./scripts/batch-fix --limit 5           # 5 oldest open issues
./scripts/batch-fix --label P1          # Только P1
./scripts/batch-fix 101 102 103         # Конкретные issues
./scripts/batch-fix --dry-run           # Показать без выполнения
```

Каждый issue: worktree → claude headless → ship. Retry 1 раз. Fail → label `needs-human`.

**Ограничения:**
- Max 15 issues за сессию (hard cap)
- Throughput guard: closed/created >= 0.7 за последние 7 дней
- `--force` для обхода throughput check

### PARALLEL MODE (несколько терминалов)

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Terminal 1    │  │   Terminal 2    │  │   Terminal 3    │
│   fix #101      │  │   fix #102      │  │   fix #103      │
│   .worktrees/   │  │   .worktrees/   │  │   .worktrees/   │
│   issue-101/    │  │   issue-102/    │  │   issue-103/    │
│   ✅ merged     │  │   ✅ merged     │  │   ✅ merged     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

**Координация:**
- WIP limit = 3 (in-progress issues на одного assignee)
- Worktrees — физическая изоляция
- Rebase при merge — автоматический (до 5 попыток)
- Конфликты — агент резолвит сам через `.ours`/`.theirs`

---

## Workflow: PHASE 1-5

### PHASE 1: UNDERSTAND

**Вход:** Номер issue

**Действия:**
```bash
gh issue view 123 --json number,title,body,labels,state
```

**Агент извлекает:**
1. `title` — название задачи
2. `body` — описание + Acceptance Criteria
3. `labels` — метки (определяют поведение: commit prefix, skip analysis)

**Ошибки:**
| Ситуация | Действие |
|----------|----------|
| Issue не найден | "Issue #N не найден. Создать или указать другой?" |
| Issue закрыт | "Issue #N закрыт. Переоткрыть или указать другой?" |
| WIP limit (>3) | "WIP limit reached. Finish existing issues first." (`--force` для обхода) |

---

### PHASE 2: SETUP

**Действия:** `./scripts/fix 123`

Скрипт делает:
1. Проверяет WIP limit (3 in-progress issues max)
2. `git fetch origin develop`
3. `git worktree add -b feat/issue-123 .worktrees/issue-123 origin/develop`
4. `pnpm install` в worktree
5. `gh issue edit 123 --add-label "status:in-progress" --add-assignee "@me"`
6. Предупреждает о stale issues (>7 дней без обновлений)

**После setup:**
```bash
cd .worktrees/issue-123
```

---

### PHASE 2.5: PRE-CODE ANALYSIS

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ОБЯЗАТЕЛЬНО перед написанием кода.                          │
│  Пропуск ТОЛЬКО для labels: docs, polish.                   │
│  ship ЗАБЛОКИРУЕТ без файла .analysis.md в worktree.        │
│                                                             │
│  ═══════════════════════════════════════════════════════    │
│                                                             │
│  1. WALKTHROUGH: пройди путь юзера по шагам                 │
│     "Нажал → увидел → ожидает"                              │
│     Если "увидел" ≠ "ожидает" — это баг, реши заранее.      │
│                                                             │
│  2. ПАТТЕРНЫ: найди 1-2 аналогичных места в коде.           │
│     Прогони через walkthrough — паттерн корректен?           │
│     • Да → используй.                                       │
│     • Нет → предложи правильный вариант.                    │
│                                                             │
│  3. ВАЛИДАЦИЯ: issue просит X, но walkthrough показывает     │
│     что нужно Y? Скажи пользователю, не делай молча X.      │
│                                                             │
│  ═══════════════════════════════════════════════════════    │
│                                                             │
│  ЗАПИШИ в .analysis.md (5-10 строк). Покажи пользователю.  │
│  Затем сразу пиши код — НЕ СПРАШИВАЙ "продолжать?"         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### PHASE 3: IMPLEMENT

**3.1. Написание кода**

- Использовать Edit/Write tools
- Следовать паттернам проекта (см. CLAUDE.md)
- Не переусложнять

**UI/UX задачи** — вызвать скилл `/ui-ux-pro-max`

**3.2. Проверки перед ship (ship делает автоматически):**
```bash
pnpm run build
pnpm run lint
```

Если ошибка — исправить. Ship сам откатит staging при fail.

---

### PHASE 4: SHIP

**Действия:** `./scripts/ship`

```
ship workflow:

1. GATE: .analysis.md существует? (skip для docs/polish)
2. GATE: проверка экспортов (нет ли missing files)
3. BUILD: pnpm run build
4. LINT: pnpm run lint
5. SCHEMA: validate_schema.py (если есть)
6. COMMIT: автопрефикс по labels:
   - bug → fix:
   - polish/refactor → refactor:
   - docs/spike → docs:
   - остальное → feat:
   Message: "<prefix>: <title> (#<issue>)"
7. PUSH: git push -u origin feat/issue-N
8. PR: gh pr create --base develop
9. MERGE: squash merge (с auto-rebase до 5 попыток)
```

**Конфликты при merge — AI-ASSISTED MERGE:**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Если rebase вызвал конфликт:                               │
│                                                             │
│  1. Lock files (pnpm-lock.yaml) → авторезолв (--theirs)    │
│                                                             │
│  2. Code files → exit 2 + CONFLICT_DETECTED:                │
│     /tmp/ship_conflict_<N>/<file>.ours   ← твои изменения  │
│     /tmp/ship_conflict_<N>/<file>.theirs ← develop          │
│     /tmp/ship_conflict_<N>/<file>.base   ← общий предок    │
│                                                             │
│  3. Агент читает .ours и .theirs, понимает intent           │
│  4. Редактирует конфликтный файл — объединяет логику       │
│  5. ./scripts/ship --continue                               │
│                                                             │
│  Агент НЕ зовёт человека. Агент резолвит сам.              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### PHASE 5: FINALIZATION

Ship автоматически:

1. **Verify PR merged** — retry merge если нет
2. **Close issue** — `gh issue close N --comment "Fixed in #PR"`
3. **Sync local develop** — `git checkout develop && git pull`
4. **Final verification** — PR=MERGED + Issue=CLOSED

**Формат вывода:**

```
✅ #123 completed

PR: https://github.com/user/repo/pull/456
PR state: MERGED ✓
Issue #123: CLOSED ✓
Local develop: synced

Acceptance Criteria:
  ✓ Кнопка logout в header
  ✓ Редирект на /login после logout
```

Если финализация не полная — выводит manual fix команды.

---

## Скрипты

### Основные

| Команда | Описание |
|---------|----------|
| `./scripts/fix <N>` | Создать worktree, setup issue |
| `./scripts/fix --stale` | Показать stale issues (>7 дней) |
| `./scripts/ship` | Commit → build → lint → PR → merge |
| `./scripts/ship --continue` | Продолжить после conflict resolution |
| `./scripts/batch-fix` | Пакетная обработка issues |
| `./scripts/prune` | Удалить worktrees для closed issues |
| `./scripts/prune --dry-run` | Показать что будет удалено |

### batch-fix

```bash
./scripts/batch-fix                    # 5 oldest open issues
./scripts/batch-fix --limit 10         # 10 issues
./scripts/batch-fix --label P1         # Только с label P1
./scripts/batch-fix 101 102 103        # Конкретные issues
./scripts/batch-fix --dry-run          # Preview
./scripts/batch-fix --force            # Bypass throughput check
```

Throughput guard: closed/created >= 0.7 за 7 дней. Не прошёл → "Close more issues first."

---

## Single Source of Truth

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  engineering/tech-spec.md  ← ЕДИНСТВЕННЫЙ источник для:     │
│    • Схемы БД (таблицы, поля, типы)                        │
│    • API контракты (endpoints, request/response)            │
│    • Алгоритмы                                             │
│                                                             │
│  design/roadmap.md  ← ЧТО и КОГДА делать                   │
│    • Ссылки на tech spec (НЕ дублирует схемы)              │
│                                                             │
│  engineering/architecture.md  ← КАК писать код              │
│    • Архитектура: api → domains → pipelines                │
│                                                             │
│  Issues  ← Конкретная задача                                │
│    • Ссылается на tech spec и roadmap                      │
│                                                             │
│  Приоритет: tech-spec > roadmap > issues                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Миграции БД

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ПРАВИЛО: миграция + код = ОДИН PR (атомарно)              │
│                                                             │
│  При изменении схемы:                                       │
│  1. Обновить engineering/tech-spec.md                        │
│  2. Создать миграцию (apply_migration)                      │
│  3. Обновить domains/*/repository.py                        │
│  4. Обновить domains/*/schemas.py                           │
│                                                             │
│  Шаблон миграции:                                           │
│  1. CREATE TABLE                                            │
│  2. ALTER TABLE ... ENABLE ROW LEVEL SECURITY               │
│  3. CREATE POLICY (anon + service_role)                     │
│  4. GRANT TO anon, authenticated, service_role              │
│                                                             │
│  ❌ Без GRANT → "permission denied" (42501)                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Деплой

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  feat/issue-N → develop (через ship)                        │
│                     │                                       │
│                     │  PR + GitHub Actions                   │
│                     ↓                                       │
│                   main (production)                          │
│                     │                                       │
│                     ├── deploy-production.yml → Web + API    │
│                     └── deploy-staging.yml → Staging env     │
│                                                             │
│  CI workflows:                                              │
│  • lint-migrations.yml — проверка миграций                 │
│  • schema-validation.yml — валидация схемы                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Структура проекта

```
rubick/
├── CLAUDE.md              # Инструкции для AI-агента
├── VIBE_SYSTEM.md         # Этот документ
├── apps/
│   ├── api/               # Python backend (FastAPI + Temporal)
│   │   └── src/
│   │       ├── api/           # HTTP роутеры
│   │       ├── domains/       # service + repository + schemas
│   │       ├── pipelines/     # Temporal workflows
│   │       ├── core/          # Config, dependencies
│   │       ├── clients/       # External API clients
│   │       └── workers/       # Temporal workers
│   └── web/               # React frontend (Vite + Tailwind v4)
├── packages/
│   ├── types/             # Shared TypeScript types
│   └── shared/            # Shared utilities
├── docs/
│   ├── engineering/
│   │   ├── tech-spec.md       # DB + API source of truth
│   │   └── architecture.md    # How to write code
│   ├── design/
│   │   └── roadmap.md         # What and when
│   └── product/
│       └── process-map.md     # Business processes
├── scripts/
│   ├── fix                # Setup worktree for issue
│   ├── ship               # Commit → PR → merge
│   ├── batch-fix          # Batch issue processing
│   └── prune              # Cleanup merged worktrees
├── .worktrees/            # Изолированные копии (gitignored)
│   ├── issue-123/
│   └── issue-124/
├── .github/
│   └── workflows/
│       ├── deploy-production.yml
│       ├── deploy-staging.yml
│       ├── lint-migrations.yml
│       └── schema-validation.yml
├── supabase/              # Migrations
├── turbo.json
└── pnpm-workspace.yaml
```

---

## WIP Management

| Механизм | Описание |
|----------|----------|
| WIP limit | Max 3 in-progress issues на assignee |
| `status:in-progress` | Label автоматически ставится при `fix` |
| Stale warning | Issues >7 дней без обновлений |
| `fix --stale` | Показать stale issues |
| `fix --force` | Обход WIP limit |
| `prune` | Удаление worktrees для closed issues |
| `prune --dry-run` | Preview удаления |

---

## Labels

| Label | Описание | Эффект на workflow |
|-------|----------|-------------------|
| `P1` | Critical path | batch-fix --label P1 |
| `P2` | Important | — |
| `P3` | Nice to have | — |
| `bug` | Something broken | commit prefix: `fix:` |
| `enhancement` | New feature | commit prefix: `feat:` |
| `polish` | Code quality | commit prefix: `refactor:`, skip analysis |
| `docs` | Documentation | commit prefix: `docs:`, skip analysis |
| `spike` | Research | commit prefix: `docs:` |
| `db` | Database/migrations | — |
| `api` | Backend | — |
| `web` | Frontend | — |
| `ui` | Frontend/UI | trigger /ui-ux-pro-max |
| `e2e` | E2E testing | — |
| `infra` | Infrastructure | — |
| `epic` | Has sub-issues | — |
| `status:in-progress` | Auto-set by fix | WIP limit tracking |
| `needs-human` | Auto-set by batch-fix | Failed after retry |

---

## Прогресс — что показывать

```
fix #123

[PHASE 1] Читаю issue...
[PHASE 2] Создаю worktree...
[PHASE 2.5] Анализирую код...
           WALKTHROUGH: Нажал Settings → увидел пустую форму → ожидает данные
           ПАТТЕРНЫ: аналог в ProfilePage.tsx — корректен
           ВАЛИДАЦИЯ: issue валиден
[PHASE 3] Пишу код...
[PHASE 4] Build... ✓
[PHASE 4] Lint... ✓
[PHASE 4] Ship → PR создан
[PHASE 4] Merge... ✓
[PHASE 5] Issue closed ✓
[PHASE 5] Local develop synced ✓

✅ #123 completed

PR: https://github.com/.../pull/87
PR state: MERGED ✓
Issue #123: CLOSED ✓
Local develop: synced

Acceptance Criteria:
  ✓ Критерий 1
  ✓ Критерий 2
```

---

## Таймауты и лимиты

| Параметр | Значение |
|----------|----------|
| WIP limit | 3 issues per assignee |
| Rebase attempts | 5 max |
| Batch session limit | 15 issues max |
| Batch throughput | closed/created >= 0.7 (7 days) |
| Batch retry | 1 retry per issue |
| Build/lint | Fail = unstage + exit 1 |

---

## Сообщения об ошибках

| Ситуация | Действие |
|----------|----------|
| Issue не найден | "Issue #N не найден" |
| Issue закрыт | "Issue #N закрыт" |
| WIP limit | "WIP limit reached. Finish existing issues first." |
| `.analysis.md` missing | ship блокирует: "BLOCKED: .analysis.md не найден" |
| Missing exports | ship блокирует: "Missing files for exports" |
| Build failed | ship откатывает staging, exit 1 |
| Lint failed | ship откатывает staging, exit 1 |
| Conflict (lock files) | Авторезолв: --theirs + переустановка |
| Conflict (code files) | exit 2 + файлы в /tmp/ship_conflict_N/ |
| Merge failed 5x | "Не удалось смержить после 5 попыток" |
| Finalization incomplete | Выводит manual fix команды |
| Batch: issue failed 2x | Label `needs-human`, skip |

---

## Версия

VIBE SYSTEM v5.0 — aligned with actual scripts (fix, ship, batch-fix, prune)
