# Архитектура: Modular Monolith

**Версия:** 1.0
**Дата:** Февраль 2026
**Тип:** Модульный монолит с вертикальными слайсами

---

## Почему Modular Monolith

| Факт о проекте | Решение |
|---|---|
| SPA без бэкенда, localStorage | Микросервисы / Clean Arch — избыточно |
| 5 чётких доменов | 5 модулей — 1:1 с итерациями roadmap |
| 1 разработчик + AI | FSD (7 слоёв) — церемониально, flat monolith — хаос |
| Zustand + localStorage | 1 store на модуль — естественное разбиение |

**Принцип:** открыл `modules/routes/` — всё на месте: компоненты, стор, типы, хуки.

---

## Структура

```
apps/web/src/
├── app/                        # Точка входа, скелет приложения
│   ├── App.tsx                 # Root: providers + router
│   ├── router.tsx              # React Router конфигурация
│   └── layout/                 # Shell: sidebar + content area
│       ├── AppLayout.tsx
│       ├── Sidebar.tsx
│       └── TopBar.tsx
│
├── modules/                    # Бизнес-модули (вертикальные слайсы)
│   ├── routes/                 # Итерации 1-2: маршрут дня, управление
│   │   ├── components/         # DaySwitcher, StopCard, StopList, Summary
│   │   ├── hooks/              # useRouteForDay, useRouteSearch
│   │   ├── store.ts            # routeStore (Zustand)
│   │   ├── types.ts            # DayRoute, RouteStop
│   │   └── index.ts            # Public API модуля
│   │
│   ├── clients/                # Итерация 4: база клиентов
│   │   ├── components/         # ClientTable, ClientForm, ClientFilters
│   │   ├── hooks/              # useClientSearch, useClientFilters
│   │   ├── store.ts            # clientStore
│   │   ├── types.ts            # Client, MatSpec
│   │   └── index.ts
│   │
│   ├── print/                  # Итерация 3: печать маршрутного листа
│   │   ├── components/         # PrintSheet, PrintTable, PrintButton
│   │   └── index.ts
│   │
│   └── import/                 # Итерация 5: Excel-импорт
│       ├── components/         # ImportWizard, ValidationTable
│       ├── lib/                # parser.ts (SheetJS), validators
│       ├── types.ts            # ParsedRow, ImportResult
│       └── index.ts
│
├── shared/                     # Общий код (без бизнес-логики)
│   ├── ui/                     # Shadcn/ui компоненты (Button, Dialog, etc.)
│   ├── lib/                    # Утилиты: cn(), formatArea(), constants
│   ├── types/                  # Общие типы: Day, MatSize, enums
│   └── data/                   # Seed data (143 клиента)
│
└── pages/                      # Тонкие страницы — только композиция модулей
    ├── RoutesPage.tsx           # <DaySwitcher> + <Summary> + <StopList>
    ├── ClientsPage.tsx          # <ClientFilters> + <ClientTable>
    └── ImportPage.tsx           # <ImportWizard>
```

---

## Правила импорта

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  СТРОГАЯ ИЕРАРХИЯ ИМПОРТОВ:                                 │
│                                                             │
│  pages/        → может импортировать из: modules/, shared/  │
│  modules/*     → может импортировать из: shared/            │
│  shared/       → может импортировать из: shared/ (соседи)   │
│                                                             │
│  ЗАПРЕЩЕНО:                                                 │
│  ✗ modules/routes/ → modules/clients/  (модуль ≠> модуль)  │
│  ✗ shared/ → modules/                  (shared ≠> модуль)  │
│  ✗ shared/ → pages/                    (shared ≠> страница)│
│  ✗ modules/ → pages/                   (модуль ≠> страница)│
│                                                             │
│  ИСКЛЮЧЕНИЕ — межмодульная связь:                           │
│  Если модулю A нужны данные модуля B:                       │
│  • Вынести общий тип в shared/types/                        │
│  • Или связать через page-level композицию (props down)     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Граф зависимостей

```
pages/ ──→ modules/* ──→ shared/
  │                        ↑
  └────────────────────────┘
```

Однонаправленный поток. Циклов нет.

---

## Модули — границы ответственности

### `modules/routes/`
- **Домен:** маршрут на день, точки (остановки), порядок объезда
- **Стор:** `routeStore` — DayRoute[], текущий день, порядок точек, чекбоксы
- **Владеет:** DaySwitcher, StopCard, StopList, Summary, drag & drop логика
- **Итерации:** 1 (просмотр), 2 (управление)

### `modules/clients/`
- **Домен:** клиентская база, коврики, частота, дни обслуживания
- **Стор:** `clientStore` — Client[], CRUD операции, фильтры
- **Владеет:** ClientTable, ClientForm, ClientFilters
- **Итерация:** 4

### `modules/print/`
- **Домен:** печатный маршрутный лист (CSS @media print)
- **Стор:** нет (читает из routeStore / clientStore через props)
- **Владеет:** PrintSheet, PrintTable, PrintButton
- **Итерация:** 3

### `modules/import/`
- **Домен:** парсинг Excel, валидация, импорт в store
- **Стор:** локальный (parsed data до подтверждения), потом пишет в clientStore
- **Владеет:** ImportWizard, ValidationTable, parser
- **Итерация:** 5

### `shared/`
- **Домен:** ничей код — UI-кит, утилиты, общие типы
- **Правило:** если что-то нужно ≥ 2 модулям — выносить сюда
- **Не класть сюда:** бизнес-логику конкретного модуля

---

## Правила файлов

### Именование

| Что | Конвенция | Пример |
|-----|-----------|--------|
| Компоненты | PascalCase.tsx | `StopCard.tsx` |
| Хуки | camelCase, префикс `use` | `useRouteForDay.ts` |
| Сторы | camelCase + `store` | `store.ts` (внутри модуля) |
| Типы | camelCase | `types.ts` (внутри модуля) |
| Утилиты | camelCase | `formatArea.ts` |
| Директории | kebab-case | `modules/routes/` |

### index.ts — Public API модуля

Каждый модуль экспортирует только через `index.ts`:

```typescript
// modules/routes/index.ts
export { DaySwitcher } from './components/DaySwitcher'
export { StopList } from './components/StopList'
export { Summary } from './components/Summary'
export { useRouteForDay } from './hooks/useRouteForDay'
export type { DayRoute, RouteStop } from './types'
```

Импорт в pages — только через index:

```typescript
// pages/RoutesPage.tsx
// ДА
import { DaySwitcher, StopList, Summary } from '@/modules/routes'

// НЕТ — прямой импорт внутренностей модуля
import { DaySwitcher } from '@/modules/routes/components/DaySwitcher'
```

### Размер файлов

- Компонент > 200 строк → разбить на подкомпоненты
- Стор > 150 строк → вынести actions в отдельный файл `actions.ts`
- Утилита > 100 строк → разбить по функциям

---

## Zustand — один стор на модуль

```typescript
// modules/routes/store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DayRoute } from './types'

interface RouteState {
  routes: DayRoute[]
  selectedDay: Day
  // actions
  selectDay: (day: Day) => void
  reorderStop: (dayId: string, from: number, to: number) => void
}

export const useRouteStore = create<RouteState>()(
  persist(
    (set) => ({
      routes: [],
      selectedDay: 'ПН',
      selectDay: (day) => set({ selectedDay: day }),
      reorderStop: (dayId, from, to) => set((state) => { /* ... */ }),
    }),
    { name: 'kover-routes' }
  )
)
```

**Правила:**
- Имя в localStorage: `kover-<module>` (kover-routes, kover-clients)
- Actions — внутри стора, не снаружи
- Селекторы — хуки в `hooks/` (если сложная выборка)
- Модуль НЕ читает чужой стор напрямую — данные передаются через props из page

---

## Pages — тонкий слой композиции

Pages НЕ содержат бизнес-логику. Их задача — собрать модули:

```typescript
// pages/RoutesPage.tsx
import { DaySwitcher, Summary, StopList } from '@/modules/routes'
import { PrintButton } from '@/modules/print'

export function RoutesPage() {
  return (
    <>
      <DaySwitcher />
      <Summary />
      <StopList />
      <PrintButton />
    </>
  )
}
```

Если page > 50 строк — бизнес-логика утекла, нужно вернуть её в модуль.

---

## Shared — утилиты и UI-кит

```
shared/
├── ui/           # Shadcn: Button, Dialog, Input, Table, Badge, etc.
├── lib/
│   ├── utils.ts  # cn() (class merge), formatArea(), formatMats()
│   └── constants.ts  # MAT_SIZES, DAYS, AREA_MAP
├── types/
│   └── index.ts  # Day, MatSize, MatColor — общие enum/типы
└── data/
    └── seed.ts   # 143 клиента (JSON, загружается при первом запуске)
```

**Shadcn компоненты** живут в `shared/ui/`. Не модифицировать без причины — использовать как есть.

---

## Алиасы путей

```typescript
// tsconfig.json paths
{
  "@/*": ["./src/*"],
  "@/modules/*": ["./src/modules/*"],
  "@/shared/*": ["./src/shared/*"]
}
```

Все импорты — через алиасы, никаких `../../..`:

```typescript
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'
import { useRouteStore } from '@/modules/routes'
```

---

## Чеклист для нового модуля

```
□ Создать директорию modules/<name>/
□ Добавить types.ts с интерфейсами
□ Добавить store.ts (если нужен стейт)
□ Добавить components/ с компонентами
□ Добавить hooks/ (если есть сложные селекторы)
□ Создать index.ts с public API
□ Создать page в pages/<Name>Page.tsx
□ Добавить route в app/router.tsx
□ Проверить: нет импортов из других modules/
```
