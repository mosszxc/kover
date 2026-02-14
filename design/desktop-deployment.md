# Десктопное развёртывание: Kover + OpenClaw

**Версия:** 2.0
**Дата:** Февраль 2026
**Целевая ОС:** Windows 11
**Статус:** Kover Tauri — реализовано (#242). KoverBot — план.

---

## Обзор

Два отдельных установщика, работающих с одной Supabase базой:

```
┌─────────────────────────────────────────────────────────────┐
│  Windows 11                                                 │
│                                                             │
│  ┌──────────────────────┐    ┌────────────────────────────┐ │
│  │  Kover-Setup.exe      │    │  KoverBot.msi              │ │
│  │                      │    │                            │ │
│  │  Tauri v2 app        │    │  Windows Service           │ │
│  │  WebView2 + Rust     │    │  "KoverBot Gateway"       │ │
│  │                      │    │                            │ │
│  │  • UI маршрутов      │    │  • Telegram бот 24/7      │ │
│  │  • Карта + печать    │    │  • GPT-4o (OpenAI)        │ │
│  │  • System tray       │    │  • Kover skill            │ │
│  │  • Auto-updater      │    │  • Аудио-транскрипция     │ │
│  │  • Нативные диалоги  │    │                            │ │
│  │  • Уведомления Win11 │    │                            │ │
│  │                      │    │                            │ │
│  │  Запуск: автозагрузка│    │  Запуск: автозагрузка     │ │
│  │  Lifecycle: tray     │    │  Lifecycle: Windows SCM   │ │
│  └──────────┬───────────┘    └──────────────┬─────────────┘ │
│             │                               │               │
│             │       Supabase Cloud          │               │
│             └──────► REST + Realtime ◄──────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Принцип:** Kover и KoverBot — параллельные клиенты. Не общаются напрямую. Данные синхронизируются через Supabase Realtime.

---

## Часть 1: Kover (Tauri v2) ✅

### Статус реализации

Epic #242 — все sub-issues закрыты:

| # | Задача | Статус |
|---|--------|--------|
| #243 | Scaffold Tauri v2 | ✅ |
| #244 | Vite dual-mode (web + desktop) | ✅ |
| #245 | System tray | ✅ |
| #246 | Автозапуск с Windows | ✅ |
| #247 | Нативные файловые диалоги | ✅ |
| #248 | Нативные уведомления Win11 | ✅ |
| #249 | Auto-updater + NSIS + зависимости | ✅ |
| #250 | CI/CD pipeline (GitHub Actions) | ✅ |
| #251 | Иконки и брендинг | ✅ |

### Архитектура

```
┌─────────────────────────────────────────────────┐
│  Kover-Setup.exe (NSIS installer)               │
│                                                 │
│  Устанавливает:                                 │
│  ├── WebView2 Runtime (embedBootstrapper)       │
│  ├── VC++ Redistributable (NSIS hook)           │
│  └── Kover.exe                                  │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  Kover.exe                               │    │
│  │                                         │    │
│  │  ┌─────────────┐  ┌──────────────────┐  │    │
│  │  │  Rust        │  │  WebView2        │  │    │
│  │  │  (backend)   │  │  (frontend)      │  │    │
│  │  │             │  │                  │  │    │
│  │  │  • tray     │  │  React 19 SPA   │  │    │
│  │  │  • autostart│  │  (apps/web/dist) │  │    │
│  │  │  • updater  │  │                  │  │    │
│  │  │  • fs/dialog│  │  isTauri() →     │  │    │
│  │  │  • notify   │  │  native features │  │    │
│  │  │  • process  │  │                  │  │    │
│  │  └──────┬──────┘  └────────┬─────────┘  │    │
│  │         │    Tauri IPC     │             │    │
│  │         └──────────────────┘             │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  Данные:                                        │
│  ├── localStorage (Zustand persist)             │
│  ├── IndexedDB (бекапы)                         │
│  └── Supabase Cloud (sync)                      │
└─────────────────────────────────────────────────┘
```

### Dual-mode: Web + Desktop

Один и тот же React SPA работает в двух режимах:

```
                    ┌─────────────────┐
                    │   apps/web/src   │
                    │   React SPA      │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              │              ▼
    ┌─────────────────┐      │    ┌─────────────────┐
    │  Браузер (PWA)  │      │    │  Tauri (WebView2)│
    │                 │      │    │                 │
    │  • Service Worker│     │    │  • System tray  │
    │  • Web Notif API│      │    │  • Native dialog│
    │  • Blob download│      │    │  • Win11 notif  │
    │  • No autostart │      │    │  • FS access    │
    │                 │      │    │  • Auto-updater │
    └─────────────────┘      │    │  • Autostart    │
                             │    └─────────────────┘
                             │
                    ┌────────┴────────┐
                    │  isTauri()      │
                    │  platform.ts    │
                    │                 │
                    │  window.        │
                    │  __TAURI_       │
                    │  INTERNALS__    │
                    └─────────────────┘
```

**Feature detection:** `shared/lib/platform.ts` → `isTauri()` проверяет `window.__TAURI_INTERNALS__`.

| Файл | Назначение |
|------|-----------|
| `shared/lib/platform.ts` | `isTauri()` — определение среды |
| `shared/lib/tauri-fs.ts` | Нативные операции с файлами |
| `shared/lib/notifications.ts` | Win11 уведомления / fallback Sonner |
| `shared/lib/autostart.ts` | Управление автозапуском |
| `shared/lib/updater.ts` | Проверка и установка обновлений |
| `modules/settings/components/AutostartToggle.tsx` | UI переключатель автозапуска |
| `modules/settings/components/NotificationToggle.tsx` | UI переключатель уведомлений |
| `modules/database/lib/exportExcel.ts` | Нативный «Сохранить как» / blob fallback |
| `modules/import/components/ExcelUpload.tsx` | Нативный «Открыть» / input fallback |

### Структура файлов

```
apps/web/
├── src/                          # React SPA (общий для web + desktop)
│   ├── shared/lib/
│   │   ├── platform.ts           # isTauri() — feature detection
│   │   ├── tauri-fs.ts           # Нативные файловые операции
│   │   ├── notifications.ts      # Win11 / Sonner fallback
│   │   ├── autostart.ts          # Tauri autostart plugin
│   │   └── updater.ts            # Tauri updater plugin
│   └── ...
├── src-tauri/                    # Tauri backend (Rust)
│   ├── Cargo.toml                # Зависимости Rust
│   ├── tauri.conf.json           # Конфигурация приложения
│   ├── build.rs                  # Tauri build script
│   ├── capabilities/
│   │   └── default.json          # Permissions (dialog, fs, notification, updater)
│   ├── src/
│   │   └── main.rs               # Rust entry: tray, window events, plugins
│   └── icons/                    # 17 иконок (ico, icns, png, Square*Logo)
│       ├── icon.ico              # Windows: Taskbar, Start Menu, Explorer
│       ├── icon.icns             # macOS (на будущее)
│       ├── 32x32.png             # Tray icon
│       ├── 128x128.png           # Standard
│       ├── 128x128@2x.png       # Retina
│       ├── Square*Logo.png       # Windows Store logos (30-310px)
│       └── StoreLogo.png         # Windows Store
└── dist/                         # Vite build output (используется обоими)
```

### Tauri Plugins

| Plugin | Cargo crate | Назначение |
|--------|-------------|-----------|
| tray-icon | `tauri` (feature) | Иконка в системном трее, контекстное меню |
| dialog | `tauri-plugin-dialog` | Нативные диалоги «Открыть» / «Сохранить как» |
| fs | `tauri-plugin-fs` | Чтение/запись файлов через Rust |
| notification | `tauri-plugin-notification` | Win11 Action Center уведомления |
| autostart | `tauri-plugin-autostart` | Запуск при входе в систему |
| updater | `tauri-plugin-updater` | Авто-обновление через GitHub Releases |
| process | `tauri-plugin-process` | Перезапуск после обновления |

### Capabilities (permissions)

`src-tauri/capabilities/default.json` — разрешения для frontend:

```
core:default, dialog:default, dialog:allow-save, dialog:allow-open,
fs:default, fs:allow-read, fs:allow-write,
notification:default, notification:allow-is-permission-granted,
notification:allow-request-permission, notification:allow-notify,
updater:default, updater:allow-check, updater:allow-download-and-install,
process:allow-restart
```

### System Tray

```
main.rs → setup()
│
├── Tray menu: "Открыть" | "Маршруты на сегодня" | "Выход"
├── Left click: toggle show/hide window
├── Close button (X): hide to tray (prevent_close)
└── --minimized flag: start hidden in tray
```

### NSIS Installer

```jsonc
// tauri.conf.json → bundle.windows.nsis
{
  "installerIcon": "icons/icon.ico",
  "installMode": "currentUser",       // Без прав администратора
  "languages": ["Russian", "English"],
  "startMenuFolder": "Kover"
}
```

**Зависимости при установке:**
- WebView2 Runtime — `embedBootstrapper` (внутри .exe, +1.8MB, работает без интернета)
- VC++ Redistributable — NSIS hook `NSIS_HOOK_POSTINSTALL` (проверяет реестр, ставит MSI)

### Auto-updater

```
Push tag v*.*.* → GitHub Actions (build-desktop.yml)
    │
    ├── windows-latest runner
    ├── pnpm install + Rust toolchain
    ├── tauri-apps/tauri-action
    │     ├── Version из git tag
    │     ├── Signing: TAURI_SIGNING_PRIVATE_KEY
    │     └── Артефакты → GitHub Release
    │
    └── Release содержит:
        ├── Kover-Setup-vX.X.X.exe    # NSIS installer
        └── latest.json               # Для updater plugin
```

**Endpoint:** `https://github.com/mosszxc/kover/releases/latest/download/latest.json`

Kover проверяет обновления при запуске → скачивает в фоне → уведомление → перезапуск.

### Сборка

```bash
# Локальная разработка
cd apps/web
pnpm tauri dev              # Vite dev server + Tauri window

# Локальная сборка
cd apps/web
pnpm build                  # Vite → dist/
pnpm tauri build            # → src-tauri/target/release/bundle/nsis/Kover-Setup.exe

# CI/CD (автоматически)
git tag v1.0.0 && git push --tags   # → GitHub Actions → Release
```

### Что НЕ меняется (web vs desktop)

- React SPA код — идентичный
- Zustand + localStorage — работает в WebView2 как в браузере
- Supabase sync — тот же fetch к REST API
- Tailwind, Shadcn, вся UI — идентично
- `pnpm dev:web` / `pnpm build` — web-версия не затронута

---

## Часть 2: KoverBot (OpenClaw как Windows Service)

### Архитектура

```
KoverBot.msi
├── openclaw-gateway.exe        ← Node.js standalone (pkg)
├── WinSW.exe                   ← Service wrapper
├── koverbot-service.xml        ← WinSW конфигурация
├── openclaw.json               ← Конфигурация агента
├── .env                        ← Ключи (вшиты при сборке)
└── workspace/
    └── skills/
        └── kover/
            └── SKILL.md        ← AI skill
```

### Компоненты

#### 1. openclaw-gateway.exe

OpenClaw — Node.js приложение. Упаковка в standalone binary:

```bash
# Вариант A: pkg (Vercel)
npx pkg node_modules/openclaw/dist/index.js \
  --target node20-win-x64 \
  --output build/openclaw-gateway.exe

# Вариант B: если OpenClaw поставляется как бинарник
# Скачать openclaw-win-x64.exe с GitHub Releases
```

#### 2. WinSW (Windows Service Wrapper)

[WinSW](https://github.com/winsw/winsw) — превращает любой .exe в Windows Service.

**koverbot-service.xml:**

```xml
<service>
  <id>KoverBot</id>
  <name>KoverBot Gateway</name>
  <description>AI Telegram-бот для управления маршрутами Kover</description>
  <executable>%BASE%\openclaw-gateway.exe</executable>
  <arguments>gateway --bind localhost --port 18789</arguments>

  <!-- Переменные окружения (вшиты при сборке) -->
  <env name="HOME" value="%BASE%"/>
  <env name="OPENCLAW_GATEWAY_TOKEN" value="ВШИТО_ПРИ_СБОРКЕ"/>
  <env name="OPENAI_API_KEY" value="ВШИТО_ПРИ_СБОРКЕ"/>
  <env name="TELEGRAM_BOT_TOKEN" value="ВШИТО_ПРИ_СБОРКЕ"/>
  <env name="SUPABASE_URL" value="ВШИТО_ПРИ_СБОРКЕ"/>
  <env name="SUPABASE_SERVICE_ROLE_KEY" value="ВШИТО_ПРИ_СБОРКЕ"/>

  <!-- Автозапуск -->
  <startmode>Automatic</startmode>
  <delayedAutoStart>true</delayedAutoStart>

  <!-- Логирование -->
  <log mode="roll-by-size">
    <sizeThreshold>10240</sizeThreshold>
    <keepFiles>3</keepFiles>
  </log>

  <!-- Рестарт при падении -->
  <onfailure action="restart" delay="10 sec"/>
  <onfailure action="restart" delay="30 sec"/>
  <onfailure action="none"/>
  <resetfailure>1 hour</resetfailure>
</service>
```

#### 3. .env (вшитый при сборке)

```env
OPENCLAW_GATEWAY_TOKEN=<сгенерированный при сборке>
OPENAI_API_KEY=sk-proj-<ключ заказчика>
TELEGRAM_BOT_TOKEN=<токен от BotFather>
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ<service role key>
```

Ключи вшиваются в `.env` или напрямую в `koverbot-service.xml` на этапе сборки. Машина целевая, один пользователь — дополнительное шифрование не требуется.

#### 4. openclaw.json (без изменений)

```json
{
  "agent": { "model": "openai/gpt-4o" },
  "tools": {
    "media": {
      "audio": {
        "enabled": true,
        "maxBytes": 20971520,
        "timeoutSeconds": 60,
        "models": [{ "provider": "openai", "model": "gpt-4o-mini-transcribe" }]
      }
    }
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "dmPolicy": "pairing",
      "groups": { "*": { "requireMention": true } }
    }
  }
}
```

#### 5. SKILL.md (без изменений)

Текущий `apps/openclaw/workspace/skills/kover/SKILL.md` — используется как есть.

---

## Установка на целевую машину

### Порядок установки

```
1. Kover-Setup.exe    → двойной клик → WebView2 + VC++ авто → готово
2. KoverBot.msi       → двойной клик → служба запущена
3. Telegram: /start   → бот спрашивает код спаривания
4. Одобрить паринг    → бот работает
```

### Kover-Setup.exe — что делает установщик

```
1. Проверяет WebView2 Runtime
   └── Нет → embedBootstrapper устанавливает (без интернета)

2. Проверяет VC++ Redistributable (реестр)
   └── Нет → устанавливает из бандлённого MSI

3. Копирует файлы в %LOCALAPPDATA%\Kover\  (currentUser mode)

4. Создаёт ярлык в Start Menu → "Kover"

5. Kover готов к запуску
```

### KoverBot.msi — что делает установщик

```
1. Копирует файлы в C:\Program Files\KoverBot\
   ├── openclaw-gateway.exe
   ├── WinSW.exe → переименован в koverbot-service.exe
   ├── koverbot-service.xml
   ├── openclaw.json
   ├── .env
   └── workspace/skills/kover/SKILL.md

2. Регистрирует Windows Service:
   koverbot-service.exe install

3. Запускает службу:
   net start KoverBot

4. Добавляет правило Windows Firewall:
   netsh advfirewall firewall add rule name="KoverBot" \
     dir=in action=allow protocol=TCP localport=18789
```

### Удаление

```
KoverBot:
1. net stop KoverBot
2. koverbot-service.exe uninstall
3. Удалить папку C:\Program Files\KoverBot\

Kover:
Через "Установка и удаление программ" (NSIS uninstaller)
```

---

## Обновление

### Kover (Tauri) — автоматическое

```
Kover запущен
    │
    ├── При старте проверяет latest.json на GitHub Releases
    │
    ├── Новая версия? → скачивает в фоне
    │
    ├── Уведомление: "Доступно обновление. Установить?"
    │
    └── Юзер подтверждает → process:restart → новая версия
```

Endpoint: `https://github.com/mosszxc/kover/releases/latest/download/latest.json`

### KoverBot — ручное

Пересобрать KoverBot.msi с обновлёнными файлами. Установка поверх — MSI автоматически останавливает службу, обновляет файлы, перезапускает.

---

## CI/CD Pipeline

### build-desktop.yml (GitHub Actions)

```
Trigger: push tag v*.*.*

Job: build-windows (windows-latest)
    │
    ├── Checkout
    ├── Setup: pnpm, Node.js 22, Rust stable
    ├── Rust cache (apps/web/src-tauri → target)
    ├── pnpm install
    ├── Version: tag → tauri.conf.json + Cargo.toml
    │
    ├── tauri-apps/tauri-action
    │     ├── projectPath: apps/web
    │     ├── Signing: TAURI_SIGNING_PRIVATE_KEY
    │     └── updaterJsonPreferNsis: true
    │
    └── Output: GitHub Release
          ├── Kover-Setup-vX.X.X.exe
          └── latest.json
```

**Secrets:**
- `TAURI_SIGNING_PRIVATE_KEY` — для подписи обновлений
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — пароль ключа

**Не затрагивает:**
- `deploy-staging.yml` — web staging (Docker)
- `deploy-production.yml` — web production (Docker)
- Vercel деплой — работает параллельно

---

## Мониторинг

### Проверка статуса KoverBot

```powershell
# PowerShell
Get-Service KoverBot

# Логи
Get-Content "C:\Program Files\KoverBot\koverbot-service.wrapper.log" -Tail 50
```

### Из Kover (опционально)

Tauri Rust backend может проверять статус службы:

```rust
#[tauri::command]
fn check_bot_status() -> bool {
    std::process::Command::new("sc")
        .args(["query", "KoverBot"])
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).contains("RUNNING"))
        .unwrap_or(false)
}
```

В UI можно показать индикатор: "Telegram-бот: активен / остановлен".

---

## Структура файлов (итог)

```
kover/
├── apps/
│   ├── web/                         # React SPA + Tauri backend
│   │   ├── src/                     # Frontend (общий web + desktop)
│   │   │   ├── shared/lib/
│   │   │   │   ├── platform.ts      # isTauri()
│   │   │   │   ├── tauri-fs.ts      # Нативные FS операции
│   │   │   │   ├── notifications.ts # Win11 / Sonner fallback
│   │   │   │   ├── autostart.ts     # Автозапуск
│   │   │   │   └── updater.ts       # Авто-обновление
│   │   │   └── modules/settings/
│   │   │       └── components/
│   │   │           ├── AutostartToggle.tsx
│   │   │           └── NotificationToggle.tsx
│   │   ├── src-tauri/               # Tauri Rust backend
│   │   │   ├── Cargo.toml
│   │   │   ├── tauri.conf.json
│   │   │   ├── build.rs
│   │   │   ├── capabilities/default.json
│   │   │   ├── src/main.rs
│   │   │   └── icons/              # 17 иконок
│   │   └── dist/                    # Vite build (web + Tauri используют)
│   └── openclaw/                    # Telegram бот
│       ├── .env
│       ├── openclaw.json
│       ├── koverbot-service.xml
│       └── workspace/skills/kover/SKILL.md
├── .github/workflows/
│   ├── build-desktop.yml            # Tag → Windows .exe → Release
│   ├── deploy-staging.yml           # Web staging
│   └── deploy-production.yml        # Web production
├── design/
│   ├── architecture.md
│   ├── tech-stack.md
│   └── desktop-deployment.md        # ← ЭТА ДОКУМЕНТАЦИЯ
└── scripts/
    └── build-desktop                # Локальная сборка
```

---

## Ограничения и риски

| Риск | Митигация |
|------|-----------|
| OpenAI API Key в plain text на диске | Допустимо: одна целевая машина, один пользователь |
| WebView2 отсутствует на старых Windows | embedBootstrapper в NSIS installer |
| VC++ Redistributable отсутствует | NSIS hook проверяет реестр, ставит MSI |
| OpenClaw падает | WinSW авторестарт (10s, 30s, stop) |
| Нет интернета | Kover: offline-first (localStorage). KoverBot: не работает |
| Смена ключей | Пересобрать KoverBot.msi с новыми ключами |
| pkg не может упаковать OpenClaw | Альтернатива: Node.js portable |
| Нет code signing | Windows SmartScreen предупреждение. Code signing — отдельная задача |

---

## Альтернативный вариант KoverBot: Node.js Portable

Если `pkg` не справляется с OpenClaw:

```
KoverBot/
├── node/                       ← Node.js portable (без установки)
│   └── node.exe
├── node_modules/
│   └── openclaw/               ← npm install openclaw
├── koverbot-service.exe        ← WinSW
├── koverbot-service.xml
├── openclaw.json
├── .env
└── workspace/skills/kover/SKILL.md
```

Размер больше (~80MB вместо ~50MB), но гарантированно работает.
