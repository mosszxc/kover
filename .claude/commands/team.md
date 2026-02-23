# /team — Agent Team для Kover

**Input:** $ARGUMENTS

---

## Инициализация

Ты — Team Lead. Прочитай протокол и контекст:

1. **Прочитай** `.claude/team/lead.md` — твой протокол (5 фаз + guardrails)
2. **Прочитай** `.claude/team/learnings.md` — накопленный опыт команды
3. **Задача:** `$ARGUMENTS`

Если `$ARGUMENTS` = `--resume`:
  - Проверь `.claude/team/session/` — найди последний checkpoint
  - `scope.md` есть → продолжи с Фазы 2
  - `findings/` не пуст → продолжи с Фазы 3
  - `synthesis.md` есть → продолжи с Фазы 4
  - Сообщи CEO откуда продолжаешь

Если `$ARGUMENTS` пуст:
  - Спроси CEO: "Какую задачу решаем?"

---

## Выполнение

Следуй протоколу из `lead.md` — 5 фаз последовательно.

### Спавн research-агентов (Фаза 2)

Для каждого агента используй Task tool:

```
Task(
  subagent_type="Explore",    # для research
  model="sonnet",              # для скорости
  prompt="
    [Содержимое .claude/team/<role>.md]

    Relevant learnings:
    [Записи из learnings.md относящиеся к задаче]

    Задача команды: [описание]
    Твой фокус: [конкретный вопрос для этой роли]

    Прочитай relevant код и дай ответ в формате:
    Вижу: [findings с ссылками на файлы]
    Предлагаю: [рекомендация]
  "
)
```

Спавни агентов **параллельно** если их вопросы независимы.

### Спавн developer-агентов (Фаза 4)

Для каждого issue **последовательно**:

```
Task(
  subagent_type="Bash",       # для execution
  model="opus",                # для качества кода
  run_in_background=true,
  prompt="
    Ты Senior Developer. Работаешь над issue #N.

    Issue: [body]
    Decision Context: [из synthesis]
    Relevant findings: [из Фазы 2]

    Выполни:
    1. cd к worktree (создан через ./scripts/fix N)
    2. Создай .analysis.md (PHASE 2.5 — walkthrough + паттерны + валидация)
    3. Напиши код
    4. ./scripts/ship

    Правила:
    - TypeScript strict, Tailwind v4, Shadcn/ui
    - Modular Monolith: modules не импортируют друг друга
    - Imports через @/* и index.ts
    - НЕ коммить вручную — ship делает всё
  "
)
```

### Роли и файлы

| Роль | Файл | Когда подключать |
|------|------|-----------------|
| Architect | `.claude/team/architect.md` | module boundaries, store design, data model |
| Senior Developer | `.claude/team/senior-developer.md` | код, паттерны, implementation |
| UX Designer | `.claude/team/ux-designer.md` | UI, design system, accessibility |
| Product Owner | `.claude/team/product-owner.md` | бизнес-ценность, user scenarios |

---

## Cleanup (после Фазы 5)

```bash
rm -f .claude/team/session/scope.md
rm -f .claude/team/session/synthesis.md
rm -rf .claude/team/session/findings/*
```
