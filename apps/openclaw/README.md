# OpenClaw — Kover Telegram Bot

AI-бот для управления маршрутами Kover через Telegram.

## Архитектура

```
Telegram (админ) → OpenClaw (AI) → Supabase REST API → PostgreSQL
```

## Быстрый старт

### 1. Создать Telegram-бота

1. Открыть [@BotFather](https://t.me/BotFather) в Telegram
2. `/newbot` → задать имя и username
3. Скопировать токен

### 2. Настроить окружение

```bash
cp .env.example .env
```

Заполнить в `.env`:
- `OPENCLAW_GATEWAY_TOKEN` — `openssl rand -hex 32`
- `ANTHROPIC_API_KEY` — ключ Anthropic API
- `TELEGRAM_BOT_TOKEN` — токен от BotFather
- `SUPABASE_URL` — URL проекта Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — серверный ключ (Settings → API → service_role)

### 3. Запустить

```bash
docker compose up -d
```

### 4. Подключить Telegram

При первом сообщении боту — получить код спаривания:

```bash
docker compose exec openclaw-gateway node dist/index.js pairing list telegram
docker compose exec openclaw-gateway node dist/index.js pairing approve telegram <CODE>
```

## Скилл Kover

Расположен в `workspace/skills/kover/SKILL.md`. Описывает:
- Схему данных Supabase (clients, drivers, routes, stops)
- REST API запросы (curl-примеры)
- Форматирование ответов для Telegram

## Установка на Windows 11

Автоматическая установка через WSL2 — без ручной работы в терминале.

### Требования

- Windows 11 с включённым WSL2
- Ключи API:
  - OpenAI API Key
  - Telegram Bot Token (от [@BotFather](https://t.me/BotFather))
  - Supabase URL и Anon Key

### Установка

1. Скачайте `koverbot-install.bat` из [GitHub Releases](https://github.com/mosszxc/kover/releases)
2. Запустите двойным кликом (от имени администратора)
3. Введите 4 ключа по запросу
4. Дождитесь завершения — скрипт установит всё автоматически:
   - Ubuntu в WSL2 (если не установлена)
   - Node.js 22
   - OpenClaw
   - Конфиги и секреты
   - systemd daemon
   - Автозапуск через Task Scheduler

### Подключение Telegram

После установки:
1. Откройте Telegram
2. Найдите вашего бота
3. Отправьте `/start`

### Обновление

Скачайте `koverbot-update.bat` из [Releases](https://github.com/mosszxc/kover/releases) и запустите.
Конфигурация и секреты сохраняются.

### Troubleshooting

```bash
# Проверить статус
wsl -d Ubuntu -- openclaw status

# Посмотреть логи
wsl -d Ubuntu -- openclaw logs

# Перезапустить
wsl -d Ubuntu -- openclaw restart

# Полная диагностика
wsl -d Ubuntu -- openclaw doctor
```

## Конфигурация

- `openclaw.json` — модель, каналы (Telegram)
- `.env` — секреты (токены, ключи)
- `workspace/skills/kover/SKILL.md` — описание скилла
