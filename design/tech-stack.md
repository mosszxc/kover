# Kover — Technical Stack

> Актуальная карта технологий проекта. Обновлено: 2026-02-14.

---

## Обзор

**Kover** — система управления маршрутами. React SPA, offline-first, опциональная облачная синхронизация.

**Архитектура:** Modular Monolith (vertical slices)
**Монорепо:** pnpm workspaces + Turborepo

---

## 1. Build & Tooling

| Инструмент | Версия | Назначение |
|------------|--------|------------|
| **Vite** | ^6.1.0 | Сборка, dev-сервер (:5173) |
| **Turborepo** | ^2.3.0 | Оркестрация задач монорепо |
| **pnpm** | 9.15.4 | Пакетный менеджер + workspaces |
| **TypeScript** | ^5.7.3 | Типизация (strict mode) |

**Команды:**

```bash
pnpm dev:web       # Dev-сервер на :5173
pnpm build         # tsc -b && vite build → apps/web/dist/
pnpm lint          # tsc --noEmit
```

**Vite плагины:**
- `@vitejs/plugin-react` — JSX/HMR для React 19
- `@tailwindcss/vite` — Tailwind CSS v4
- `vite-plugin-pwa` — Service Worker + Web Manifest

**TypeScript конфигурация:**
- Target: ES2020
- Module: ESNext (bundler resolution)
- Strict: true, noUnusedLocals, noUnusedParameters, noUncheckedIndexedAccess
- Path aliases: `@/*`, `@/modules/*`, `@/shared/*`

---

## 2. Frontend Framework

| Инструмент | Версия | Назначение |
|------------|--------|------------|
| **React** | ^19.0.0 | UI-фреймворк |
| **React DOM** | ^19.0.0 | Рендеринг |
| **React Router** | ^7.1.5 | Клиентский роутинг |

**Маршруты (9 штук):**

| Путь | Страница | Lazy |
|------|----------|------|
| `/` | RoutesPage | Нет |
| `/clients` | ClientsPage | Нет |
| `/drivers` | DriversPage | Нет |
| `/mat-sizes` | MatSizesPage | Нет |
| `/settings` | SettingsPage | Нет |
| `/import` | ImportPage | Да |
| `/stats` | StatsPage | Да |
| `/map` | MapPage | Да |
| `/database` | DatabasePage | Да |
| `/guide` | GuidePage | Да |

---

## 3. Стилизация

| Инструмент | Версия | Назначение |
|------------|--------|------------|
| **Tailwind CSS** | ^4.0.7 | Utility-first CSS |
| **CVA** | ^0.7.1 | Варианты компонентов |
| **clsx** | ^2.1.1 | Условные классы |
| **tailwind-merge** | ^3.0.1 | Слияние Tailwind-классов |

**Особенности:**
- Tailwind v4 — конфигурация через `@theme inline` в `index.css` (нет tailwind.config)
- Цветовое пространство OKLCH
- Dark mode first (light mode как вариант)
- Радиус: `--radius: 0.625rem`
- Утилита `cn()`:
  ```typescript
  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
  }
  ```

**Print-стили:**
- A4 portrait, 15mm margin
- Шрифт 14pt, бордеры 0.5pt
- Классы: `.no-print`, `.print-header`, `.print-table`, `.print-checkbox`

---

## 4. UI-компоненты

| Инструмент | Версия | Назначение |
|------------|--------|------------|
| **Shadcn/ui** | — | Headless UI-компоненты (стиль: new-york) |
| **Radix UI** | ^1.4.3 | Примитивы (dialog, dropdown, select и др.) |
| **Lucide React** | ^0.474.0 | SVG-иконки |
| **Sonner** | ^2.0.7 | Toast-уведомления |

**Установленные Shadcn-компоненты:**
`button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `select`, `alert-dialog`, `sonner`

**Shadcn paths:**
- Компоненты: `@/shared/ui`
- Утилиты: `@/shared/lib/utils`
- Иконки: `lucide`

---

## 5. State Management

| Инструмент | Версия | Назначение |
|------------|--------|------------|
| **Zustand** | ^5.0.3 | Менеджер состояния |
| **Zundo** | ^2.3.0 | Undo/redo middleware (20 шагов) |

**Сторы:**

| Стор | localStorage ключ | Версия | Undo/Redo | Supabase Sync |
|------|-------------------|--------|-----------|---------------|
| `useRouteStore` | `kover-routes` | v4 | Да | Да |
| `useClientStore` | `kover-clients` | v1 | Да | Да |
| `useDriverStore` | `kover-drivers` | v2 | Да | Да |
| `useMatSizeStore` | `kover-mat-sizes` | — | Нет | Да |
| `useSettingsStore` | `kover-settings` | — | Нет | Нет |
| `useChangeLogStore` | `kover-changelog` | — | Нет | Да |
| `useServiceLogStore` | `kover-service-log` | — | Нет | Да |
| `useSeedStore` | `kover-seed` | v2 | Нет | Нет |
| `useGeocodeProgressStore` | — | — | Нет | Нет |

**Стек middleware (routes, clients, drivers):**
```
persist(temporal(supabaseSync(...), { limit: 20 }), { name: 'kover-*', version: N })
```

---

## 6. Персистентность данных

Трёхуровневая стратегия:

```
┌─────────────────────────────────────────────┐
│  1. localStorage (всегда)                    │
│     Zustand persist, ключи kover-*           │
│     Миграции версий встроены                 │
├─────────────────────────────────────────────┤
│  2. IndexedDB (idb-keyval ^6.2.2)           │
│     Бэкапы, крупные данные                   │
├─────────────────────────────────────────────┤
│  3. Supabase (опционально)                   │
│     Write-through sync при обновлении стора  │
│     Realtime подписки (Postgres Changes)     │
│     Graceful fallback если недоступен        │
└─────────────────────────────────────────────┘
```

---

## 7. Облачная синхронизация

| Инструмент | Версия | Назначение |
|------------|--------|------------|
| **@supabase/supabase-js** | ^2.95.3 | BaaS, Realtime sync |

**Env-переменные:**
- `VITE_SUPABASE_URL` — URL проекта
- `VITE_SUPABASE_ANON_KEY` — публичный ключ

**Таблицы Supabase:**
`clients`, `drivers`, `mat_sizes`, `day_routes`, `route_stops`, `changelog`, `service_log`

**Паттерн синхронизации:**
```typescript
interface SyncAdapter<TLocal, TRemote> {
  table: string
  toRemote(local: TLocal): TRemote
  toLocal(remote: TRemote): TLocal
}
```

- Write-through: `supabaseSync()` middleware перехватывает `set()`
- Сравнивает before/after, делает upsert/delete
- Realtime: подписка на INSERT/UPDATE/DELETE через Postgres Changes

---

## 8. Карты и геолокация

| Инструмент | Версия | Назначение |
|------------|--------|------------|
| **Leaflet** | ^1.9.4 | Интерактивные карты |
| **react-leaflet** | ^5.0.0 | React-обёртка |

**Внешние API:**
- **Nominatim** (OpenStreetMap) — геокодинг адресов → координаты, фильтр `countrycodes: 'ru'`
- **OSRM** — оптимизация маршрутов (vehicle routing, TSP)

**Алгоритмы (tsp.ts):**
- Haversine distance (большой круг)
- Nearest Neighbor heuristic
- 2-opt локальная оптимизация
- Fallback на неоптимизированный порядок

---

## 9. Импорт/экспорт данных

| Инструмент | Версия | Назначение |
|------------|--------|------------|
| **xlsx (SheetJS)** | ^0.18.5 | Парсинг Excel-файлов |

**Формат импорта:**
- Master-лист: «Неделя» (таблица клиентов)
- Листы маршрутов: «ПН», «ВТ», «СР», «ЧТ», «ПТ», «СБ», «ВС»

**Экспорт:**
- @media print стили для печати маршрутных листов

---

## 10. Drag & Drop

| Инструмент | Версия | Назначение |
|------------|--------|------------|
| **@dnd-kit/core** | ^6.3.1 | DnD-примитивы |
| **@dnd-kit/sortable** | ^10.0.0 | Сортируемые коллекции |
| **@dnd-kit/utilities** | ^3.2.2 | Хелперы |

**Использование:** переупорядочивание остановок маршрута внутри дня.

---

## 11. PWA

**Конфигурация (vite-plugin-pwa):**
- Registration: `autoUpdate`
- Display: `standalone`
- Theme: `#1a1a2e`
- Service Worker: Workbox
- Кеширование: `**/*.{js,css,html,ico,png,svg,woff2}`
- Navigation fallback: `/index.html`

**Иконки:**
- `pwa-192x192.png` (standard)
- `pwa-512x512.png` (standard + maskable)
- `apple-touch-icon-180x180.png`
- `favicon.svg`

---

## 12. CI/CD & Деплой

### Vercel (основной)
```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "apps/web/dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### GitHub Actions

| Workflow | Триггер | Артефакт | Особенности |
|----------|---------|----------|-------------|
| `deploy-staging.yml` | push → `develop` | Docker → GHCR | Health check, Slack |
| `deploy-production.yml` | push → `main` | Docker → GHCR | Manual approval, rollback, semver |

**Docker-образы:** `ghcr.io/<org>/kover`
- Staging: `staging-<sha>`, `staging`
- Production: `prod-<sha>`, `latest`, `<semver>`

---

## 13. Автоматизация (scripts/)

| Скрипт | Назначение |
|--------|------------|
| `./scripts/fix N` | Создать worktree для issue, начать работу |
| `./scripts/ship` | Коммит, PR, merge → develop |
| `./scripts/batch-fix` | Пакетная обработка issues |
| `./scripts/prune` | Очистка merged worktrees |
| `./scripts/dev` | Запуск dev-сервера |

**Workflow:** `fix N` → работа в `.worktrees/issue-N/` → `.analysis.md` → код → `ship`

---

## 14. Модули приложения

```
modules/
├── routes/     # Маршруты дня, остановки, DnD-сортировка
├── clients/    # CRUD клиентов, геокодинг, пауза
├── drivers/    # Водители, рабочие дни
├── print/      # Печать маршрутных листов (@media print)
├── import/     # Импорт из Excel + валидация
├── map/        # Визуализация маршрутов на карте
├── stats/      # Статистика и аналитика
├── settings/   # Настройки приложения
├── database/   # Просмотр/управление данными
└── guide/      # Встроенная справка
```

**Правила импорта:**
```
pages/ → modules/* → shared/   (строго однонаправленно)
modules/A ✗ modules/B          (запрещено)
Cross-module → shared/types/ или props из page
```

---

## 15. Ключевые типы данных

```typescript
type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6  // Пн–Вс

interface Client {
  id, name, address, mats: MatSpec[], frequency, days: DayOfWeek[],
  isActive, pausedUntil?, lat?, lng?, notes, createdAt
}

interface RouteStop {
  id, clientId, position, isCompleted, driverId?, skippedUntil?
}

interface DayRoute { day: DayOfWeek, stops: RouteStop[] }

interface Driver {
  id, name, phone, isActive, workDays: DayOfWeek[], createdAt
}
```

---

## 16. Дизайн-система

**Стиль:** Minimalism + Flat Design
**Шрифт:** Inter (400/600/700)
**Тема:** Dark mode first

| Роль | Цвет (dark) |
|------|-------------|
| Background | `slate-950` / `#020617` |
| Surface | `slate-900` / `#0F172A` |
| Surface Raised | `slate-800` / `#1E293B` |
| Text Primary | `slate-50` / `#F8FAFC` |
| Primary | `blue-600` / `#2563EB` |
| CTA/Warning | `orange-500` / `#F97316` |
| Success | `green-500` / `#22C55E` |
| Destructive | `red-500` / `#EF4444` |

Подробнее: `design-system/kover/MASTER.md`

---

## 17. Полная карта зависимостей

### Production

| Пакет | Версия | Категория |
|-------|--------|-----------|
| react | ^19.0.0 | Framework |
| react-dom | ^19.0.0 | Framework |
| react-router | ^7.1.5 | Routing |
| zustand | ^5.0.3 | State |
| zundo | ^2.3.0 | State (undo/redo) |
| @supabase/supabase-js | ^2.95.3 | Backend |
| idb-keyval | ^6.2.2 | Storage |
| radix-ui | ^1.4.3 | UI primitives |
| class-variance-authority | ^0.7.1 | UI utilities |
| clsx | ^2.1.1 | UI utilities |
| tailwind-merge | ^3.0.1 | UI utilities |
| lucide-react | ^0.474.0 | Icons |
| sonner | ^2.0.7 | Notifications |
| @dnd-kit/core | ^6.3.1 | DnD |
| @dnd-kit/sortable | ^10.0.0 | DnD |
| @dnd-kit/utilities | ^3.2.2 | DnD |
| leaflet | ^1.9.4 | Maps |
| react-leaflet | ^5.0.0 | Maps |
| @tanstack/react-table | ^8.21.3 | Tables |
| xlsx | ^0.18.5 | Excel |

### Dev

| Пакет | Версия | Категория |
|-------|--------|-----------|
| vite | ^6.1.0 | Build |
| @vitejs/plugin-react | ^4.3.4 | Build |
| typescript | ^5.7.3 | Types |
| tailwindcss | ^4.0.7 | Styling |
| @tailwindcss/vite | ^4.0.7 | Styling |
| vite-plugin-pwa | ^1.2.0 | PWA |
| @types/react | ^19.0.8 | Types |
| @types/react-dom | ^19.0.3 | Types |
| @types/leaflet | ^1.9.21 | Types |
| @types/node | ^22.13.4 | Types |
| turbo | ^2.3.0 | Monorepo |
