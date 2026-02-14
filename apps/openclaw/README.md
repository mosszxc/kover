# Kover OpenClaw — Telegram-бот

AI-ассистент для управления маршрутами через Telegram.

## Быстрый старт

### 1. Telegram-бот

1. Открыть [@BotFather](https://t.me/BotFather) в Telegram
2. `/newbot` → указать имя (например, "Kover Bot")
3. Скопировать токен

### 2. Настройка

```bash
cp .env.example .env
# Заполнить: ANTHROPIC_API_KEY, TELEGRAM_BOT_TOKEN, PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD
```

### 3. Запуск

```bash
docker compose up -d
```

PocketBase будет доступен на `http://localhost:8090`, OpenClaw Gateway на `ws://localhost:18789`.

### 4. Первичная настройка PocketBase

1. Открыть `http://localhost:8090/_/`
2. Создать admin-аккаунт (использовать email/пароль из `.env`)
3. Миграции применятся автоматически

### 5. Подключение Telegram

При первом сообщении боту — OpenClaw потребует pairing-код:

```bash
docker exec kover-openclaw openclaw pairing approve telegram <код>
```

## Файлы

| Файл | Описание |
|------|----------|
| `docker-compose.yml` | OpenClaw + PocketBase |
| `openclaw.json` | Конфигурация OpenClaw |
| `workspace/SOUL.md` | Персона бота |
| `workspace/skills/kover/SKILL.md` | Kover-скилл (API-описание) |
| `.env.example` | Шаблон переменных окружения |
