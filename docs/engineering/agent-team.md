# Agent Team — Команда разработки Kover

**Статус:** v1.0 — полный цикл (research → issues → code → ship)
**Конфигурация:** `.claude/team/`
**Skill:** `/team`

## 1. Что это

Agent Team — команда из 4 AI-специалистов с предзагруженными ролями. **Главный контекст Claude Code выступает Team Lead** — координирует полный цикл от идеи до merged PR. Отдельный Lead-агент НЕ спавнится.

**`/team` — единый entry point** для любой нетривиальной задачи. Полный цикл:

```
/team "задача"
  Фаза 0: Context     → learnings.md
  Фаза 1: Scope       → оценка + checkpoint для CEO
  Фаза 2: Research    → specialists читают код, дают рекомендации
  Фаза 3: Synthesis   → сводка для CEO → одобрение
  Фаза 4: Execution   → create issues → fix #N → ship (sequential)
  Фаза 5: Learn       → patterns, anti-patterns → learnings.md
```

**Внутренние инструменты** (вызываются `/team`, не юзером напрямую):
- `/add` — создание issues (Фаза 4)
- `fix #N` + `ship` — execution каждого issue (Фаза 4)

**Shortcut для мелочей:** юзер может вызвать `fix #N` напрямую без `/team` — для тривиальных задач где проектирование не нужно.

## 2. Команда

| # | Роль | Файл | Вопрос |
|---|------|------|--------|
| 0 | **Team Lead** | `lead.md` | Как координировать и синтезировать? (**= главный контекст, не агент**) |
| 1 | **Architect** | `architect.md` | Правильно ли системно? Modular Monolith, store design, data flow? |
| 2 | **Senior Developer** | `senior-developer.md` | Правильно ли в коде? React/Zustand/Tailwind паттерны? |
| 3 | **UX Designer** | `ux-designer.md` | Удобно ли для пользователя? Design system, accessibility? |
| 4 | **Product Owner** | `product-owner.md` | Полезно ли для бизнеса? Что реально нужно диспетчеру/водителю? |

**Lead НЕ спавнит всех 4.** Подключает 2-3 специалиста в зависимости от задачи:

| Тип задачи | Кого подключает Lead |
|------------|---------------------|
| Новый модуль / рефакторинг | Architect + Developer |
| UI компонент / страница | UX + Developer + Product Owner |
| Data model / store design | Architect + Developer |
| UX flow / юзабилити | UX + Product Owner |
| Code review | Architect + Developer |
| Новая фича (полный цикл) | Architect + UX + Product Owner |

### Режимы работы

Lead выбирает режим в зависимости от сложности задачи:

| Режим | Когда | Кто работает | Токены |
|-------|-------|-------------|--------|
| **SOLO** | Вопрос, мелкая задача, консультация | Lead отвечает сам | x1 |
| **PAIR** | Средняя задача, одна экспертиза | Lead + 1 агент | x2 |
| **TEAM** | Крупная задача, несколько экспертиз | Lead + 2-3 агента | x3-4 |

**TEAM оправдан ТОЛЬКО если:**
- Решение затрагивает 3+ файлов в разных модулях
- Решение меняет data model или module boundaries
- Нужны 2+ разные экспертизы (например, architecture + UX)

Всё остальное — SOLO или PAIR. Default = PAIR.

## 3. Протокол работы (5 фаз)

```
Фаза 0: CONTEXT    → Lead читает learnings.md, адаптирует процесс
Фаза 1: SCOPE      → Оценка размера + CHECKPOINT для CEO
Фаза 2: RESEARCH   → Агенты читают код, дают рекомендации, дискутируют
Фаза 3: SYNTHESIS  → Сводка для CEO: рекомендация + риски + план → одобрение
Фаза 4: EXECUTION  → 4a: create issues → 4b: fix → ship (sequential)
Фаза 5: LEARN      → Patterns, anti-patterns → learnings.md
```

### Фаза 0: CONTEXT
Lead читает `.claude/team/learnings.md` — накопленный опыт команды. Передаёт relevant записи агентам при спавне. Команда не начинает с нуля.

### Фаза 1: SCOPE + CHECKPOINT
Lead оценивает размер задачи и выбирает режим (SOLO/PAIR/TEAM). Затем показывает CEO **информационный checkpoint** (НЕ блокирующий):

```
Понял задачу: [суть в 1-2 предложениях]
Режим: TEAM
Подключаю: Architect (module boundaries) + UX (user flow)
Фокус: [что каждый будет делать]
```

CEO может скорректировать. Если молчит — Lead начинает. Это **не** "продолжать?", а "вот как я понял".

Если > 500 строк / 7 файлов — показывает план этапов, НЕ начинает без одобрения.

**Checkpoint:** Lead сохраняет scope в `.claude/team/session/scope.md`.

### Фаза 2: RESEARCH
- **2a:** Lead раздаёт задачи — каждый агент получает СВОЙ аспект
- **2b:** Каждый агент ОБЯЗАН прочитать relevant код и ссылаться на файлы. Без цитат = мнение отклоняется
- **2c:** Lead шарит findings между агентами, провоцирует дискуссию: "Architect сказал X, что думаешь?"

**Checkpoint:** Lead сохраняет findings в `.claude/team/session/findings/` (по одному файлу на агента).

### Фаза 3: SYNTHESIS

**Ключевой принцип: Lead ПРИНИМАЕТ решение, CEO ОДОБРЯЕТ/КОРРЕКТИРУЕТ.**

Перед показом CEO — Lead проходит quality gate:
- Все агенты дали evidence (ссылки на код)?
- Нет unresolved конфликтов?
- Scope не уехал от задачи из checkpoint Фазы 1?
- **Synthesis содержит ОДНУ рекомендацию (не меню вариантов)?**
- **Synthesis содержит конкретный план issues с sizing?**

Если любой пункт нет — Lead возвращается к нужной фазе, не показывает CEO сырое.

CEO видит **одно сообщение**:
```
Рекомендация: [что делаем и почему]
Отклонено: [альтернатива] — [почему хуже]
Риск: [что может пойти не так, митигация]
План:
  Issue 1: [название] — Size M, ~N files
  Issue 2: [название] — Size M, ~N files
```

**Anti-pattern:** "Вот 4 варианта, что выбираешь?" — это перекладывание решения. Lead анализирует, выбирает лучший подход, CEO одобряет или корректирует.

**Checkpoint:** Lead сохраняет synthesis в `.claude/team/session/synthesis.md`.

### Фаза 4: EXECUTION

Полный цикл: создание issues → code → ship. Lead оркестрирует всё.

#### 4a: Создание issues

После одобрения CEO — Lead создаёт issues через `/add` (problem-focused, без решений в body).

- 1 issue = 1 PR — ВСЕГДА
- Каждый issue = vertical slice
- **Sizing Gate:** M=ok, L=warning, XL=разбей

**Decision Context обязателен:**

| Размер решения | Формат | Где хранится |
|---------------|--------|-------------|
| 1 issue | `## Decision Context` секция в issue body | В самом issue |
| 3+ issues | Отдельный файл + ссылки из issues | `docs/engineering/decisions/` |

#### 4b: Sequential execution

Lead спавнит developer-агентов для каждого issue **последовательно**:

```
Для каждого issue по порядку:
  1. Lead спавнит developer agent (Task tool, opus, run_in_background)
  2. Agent: cd .worktrees/issue-N → .analysis.md → код → ./scripts/ship
  3. Lead ждёт завершения → проверяет PR merged + issue closed
  4. Следующий issue
```

**Строго последовательно.** Параллельный fix допускается ТОЛЬКО если issues в разных модулях и нет общих файлов.

#### 4c: Verification

После всех issues:
- Lead проверяет: все PR merged? Все issues closed?
- Если нет — retry или escalation к CEO

### Фаза 5: LEARN
Lead записывает в `learnings.md`:
- **Patterns** — что сработало
- **Anti-patterns** — что не сработало + **почему казалось что сработает**
- **Guardrail updates** — как обновить протокол
- **CEO preferences** — фидбек, стиль работы

## 4. Guardrails (защитные функции)

### Per-role guardrails

| Роль | GUARD (ключевой) |
|------|-----------------|
| Architect | YAGNI — не предлагай сложнее чем нужно. Это SPA + localStorage, не микросервисы |
| Senior Developer | ВСЕГДА читай existing code перед предложением. Следуй Modular Monolith |
| UX Designer | Не упрощай в ущерб функциональности. MASTER.md — закон |
| Product Owner | Оценивай из реального опыта диспетчера/водителя. Конкретные сценарии, не абстракции |

### Team Lead guardrails

| Guardrail | Правило |
|-----------|---------|
| Scope explosion | > 500 строк → разбей, покажи CEO |
| Echo chamber | Все согласны → каждый обязан назвать 1 проблему |
| No evidence | Агент без ссылок на код → отклони мнение |
| Endless debate | > 3 раундов без прогресса → прими решение |
| Over-staffing | Простая задача → SOLO, не спавни 4 агентов |

### Evidence Rule (для всех)
Каждое предложение ОБЯЗАНО содержать ссылку на:
- Existing code (файл:строка), ИЛИ
- Design system (MASTER.md секция), ИЛИ
- Architecture (architecture.md правило), ИЛИ
- User flow (диспетчер делает X → видит Y)

Без evidence = мнение, не экспертиза. Lead отклоняет.

### LLM Failure Mode Mitigations

| Failure mode | Митигация |
|-------------|-----------|
| **Anchoring** | Агенты работают параллельно, не видят ответы друг друга до Phase 2c |
| **Sycophancy** | Все согласны? → каждый обязан назвать 1 проблему |
| **Verbosity** | Ответ агента > 300 слов → Lead просит сократить |
| **Premature convergence** | Сошлись за 1 раунд? → "Назовите альтернативу и почему она хуже" |
| **Hallucination** | Spot-check: Lead проверяет 1 случайное утверждение (файл:строка) |
| **Passivity** | Output template: "Вижу X → предлагаю Y" — findings первые, не контекст |

## 5. Learning System

`learnings.md` — persistent memory команды. Растёт после каждой задачи.

### Четыре типа записей

| Тип | Что | Пример |
|-----|-----|--------|
| **Pattern** | Что работает | "StopCard — vertical slice: component + hook + type в modules/routes" |
| **Anti-pattern** | Что не работает + почему казалось правильным | "Общий store казался DRY, но нарушает module isolation" |
| **Guardrail update** | Обновление протокола | "Architect ВСЕГДА проверяет index.ts exports при новом компоненте" |
| **CEO Feedback** | Фидбек от CEO к конкретной роли | "Product Owner: мало конкретики, нужны сценарии из жизни диспетчера" |

### CEO Preferences
Записи о том как CEO работает:
- Preferences: стиль общения, что важно
- Decision patterns: как принимает решения
- Working style: уровень вовлечённости

Lead читает preferences в начале каждой задачи и адаптирует процесс.

## 6. Использование

### Запуск
```
/team <задача>
```

### Примеры
```
/team Добавить модуль водителей — CRUD + привязка к маршрутам
/team Рефакторинг print модуля — вынести логику из page
/team Новая страница настроек — тема, seed data, экспорт
/team Оптимизировать StopList — рендерится медленно на 30+ точках
/team Как лучше сделать drag & drop между маршрутами разных дней
```

### Что происходит
1. Lead читает `lead.md` + `learnings.md` → контекст
2. Оценивает задачу, выбирает режим (SOLO/PAIR/TEAM) → checkpoint CEO
3. Спавнит specialists (Task tool, sonnet, параллельно) → research
4. Собирает findings, проводит дискуссию → synthesis
5. CEO получает сводку → одобряет
6. Lead создаёт issues (`/add`) с Decision Context
7. Lead спавнит developer-агентов (Task tool, opus, sequential)
8. Каждый agent: `fix #N` → `.analysis.md` → код → `./scripts/ship`
9. Lead проверяет: все PR merged, все issues closed
10. Записывает learnings, cleanup session/

## 7. Файловая структура

```
.claude/
├── commands/
│   ├── add.md               ← /add skill (создание issues)
│   └── team.md              ← /team skill (точка входа)
├── team/
│   ├── lead.md              ← Протокол Team Lead (5 фаз + guardrails)
│   ├── architect.md         ← Modular Monolith, store design, data flow
│   ├── senior-developer.md  ← React/Zustand/Tailwind, код, паттерны
│   ├── ux-designer.md       ← Design system (MASTER.md), accessibility
│   ├── product-owner.md     ← Бизнес-взгляд, реальные сценарии
│   ├── learnings.md         ← Persistent memory (растёт со временем)
│   └── session/             ← Checkpoints текущей сессии (recovery)
│       ├── scope.md         ← После Фазы 1
│       ├── findings/        ← После Фазы 2 (по файлу на агента)
│       └── synthesis.md     ← После Фазы 3
└── skills/
    ├── batch/SKILL.md       ← /batch (пакетная обработка issues)
    └── deploy/SKILL.md      ← /deploy (merge develop → master)
```

## 8. Технические детали

### Инфраструктура
- **Task subagents** — стабильный подход через Task tool
- Research agents: `model="sonnet"`, параллельно
- Developer agents: `model="opus"`, sequential, `run_in_background=true`
- Каждый агент получает: role prompt + relevant learnings + task context

### Ограничения
- Каждый agent = отдельный Task (токены x2-4 для TEAM)
- Агенты НЕ могут спавнить других агентов — только Lead
- Один /team session за раз — cleanup session/ перед новым

### Recovery при падении
Если сессия упала — `/team --resume` читает последний checkpoint:

```
session/scope.md существует     → продолжить с Фазы 2
session/findings/ не пуст       → продолжить с Фазы 3
session/synthesis.md существует  → продолжить с Фазы 4
```

Lead очищает `session/` после завершения задачи (Фаза 5).

### Token budget
- SOLO (Lead сам): ~10-30K tokens
- PAIR (Lead + 1 агент): ~50-100K tokens
- TEAM (Lead + 2-3 агента): ~150-250K tokens

**Cost guardrail:** если после Фазы 2 потрачено >200K токенов а прогресса нет → abort, переформулируй задачу.

## 9. Полный workflow

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  /team "задача"                                          │
│    │                                                     │
│    ├── Фаза 0-1: Context + Scope                        │
│    │   Lead читает learnings → оценивает → checkpoint    │
│    │                                                     │
│    ├── Фаза 2: Research                                  │
│    │   Lead спавнит specialists (sonnet, параллельно)    │
│    │   → собирает findings → дискуссия                  │
│    │                                                     │
│    ├── Фаза 3: Synthesis → CEO                          │
│    │   Quality gate → одно сообщение → CEO одобряет     │
│    │                                                     │
│    ├── Фаза 4: Execution                                │
│    │   4a: Lead создаёт issues (/add)                   │
│    │   4b: Для каждого issue ПОСЛЕДОВАТЕЛЬНО:           │
│    │       └── Lead спавнит developer agent (opus, bg)   │
│    │           └── fix #N → .analysis.md → код → ship   │
│    │               └── Lead проверяет: merged? closed?   │
│    │   4c: Verification — все PRs merged, issues closed │
│    │                                                     │
│    └── Фаза 5: Learn                                    │
│        Patterns + anti-patterns → learnings.md          │
│        Cleanup session/                                  │
│                                                          │
└──────────────────────────────────────────────────────────┘

Shortcuts (без /team):
  fix #N        → тривиальная задача, проектирование не нужно
  /batch        → обработка существующего backlog issues
```
