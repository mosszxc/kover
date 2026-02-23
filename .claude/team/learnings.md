# Team Learnings — Kover

Persistent memory команды. Обновляется после каждой /team задачи.

---

## Patterns

- **PAIR mode для UI-задач**: UX Designer + Product Owner — достаточно для UI-улучшений без архитектурных изменений. Architect не нужен если data model не трогаем.
- **PO переворачивает логику**: PO хорошо выявляет когда UI отвечает на неправильный вопрос ("что есть" vs "хватит ли"). Подключать PO для UX-задач даже если кажется что это "просто UI".
- **Summary bar паттерн**: MASTER.md имеет паттерн Summary Block (icon + value + label, text-2xl bold tabular-nums). Использовать для любых dashboard-страниц как первый уровень информации.
- **Collapsible для редких данных**: Данные которые нужны раз в месяц (износ, история) → collapsible, свёрнуты по умолчанию. Раскрываются автоматически при проблемах (wearPercent >= 80%).

## Anti-patterns

- **Flat number lists**: 6 строк одинакового text-sm без иерархии — пользователь не знает куда смотреть. Всегда выделять 1 главную метрику крупно.

## Architecture

- **localStorage → Supabase миграция**: 3 паттерна sync в Kover:
  1. `supabaseSync` middleware — для сторов с одним массивом (payments, routeExceptions, serviceReports, debtContacts)
  2. `subscribe-based sync` — для сторов с несколькими массивами (routes, inventory: 3 массива)
  3. `syncSettingChange` — для key/value настроек через settings таблицу
- **SyncProvider hydration**: `fetchAll` → `mergeById` для данных, `hydrateSettings` для настроек, `setupRealtimeSubscriptions` для live-обновлений
- **MatInventory не имеет `id`**: использует `sizeId` как PK, адаптер маппит `id ↔ sizeId`. Тип адаптера — `any` из-за несовпадения.
- **Settings sync**: всё через таблицу `settings` (key/value jsonb). Ключи: theme, autostartEnabled, startMinimized, costSettings, invoiceSettings, maxStopsPerDay, printSettings, lastSeenVersion, churnDismissals
- **SaveIndicator**: слушает CustomEvent `kover-synced` вместо перехвата localStorage

## Guardrail Updates

_Пока пусто._

## CEO Feedback

_Пока пусто._

## CEO Preferences

- "не спрашивай продолжать — делай"
- прямой стиль общения, без церемоний
