@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

:: ════════════════════════════════════════════════════════════
::  KoverBot Installer — Windows 11 + WSL2
::  Устанавливает OpenClaw (Telegram AI-бот) в WSL2
:: ════════════════════════════════════════════════════════════

title KoverBot Installer

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║                                                      ║
echo  ║   KoverBot Installer                                 ║
echo  ║   Установка OpenClaw в WSL2                          ║
echo  ║                                                      ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

:: ──────────────────────────────────────────────────────────
::  Step 1: Check admin rights
:: ──────────────────────────────────────────────────────────
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] Требуются права администратора.
    echo      Нажмите правой кнопкой → "Запуск от имени администратора"
    echo.
    pause
    exit /b 1
)
echo  [✓] Права администратора

:: ──────────────────────────────────────────────────────────
::  Step 2: Check WSL2
:: ──────────────────────────────────────────────────────────
echo.
echo  [1/8] Проверяю WSL2...

wsl --status >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [!] WSL2 не установлен.
    echo.
    echo      Откройте PowerShell от администратора и выполните:
    echo.
    echo        wsl --install
    echo.
    echo      После установки перезагрузите компьютер и запустите
    echo      этот скрипт снова.
    echo.
    pause
    exit /b 1
)
echo  [✓] WSL2 установлен

:: ──────────────────────────────────────────────────────────
::  Step 3: Check Ubuntu
:: ──────────────────────────────────────────────────────────
echo  [2/8] Проверяю Ubuntu...

wsl -d Ubuntu -- echo ok >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [i] Ubuntu не найдена. Устанавливаю...
    wsl --install -d Ubuntu --no-launch
    if %errorlevel% neq 0 (
        echo  [!] Не удалось установить Ubuntu.
        echo      Попробуйте вручную: wsl --install -d Ubuntu
        pause
        exit /b 1
    )
    echo.
    echo  [!] Ubuntu установлена. Нужна настройка.
    echo      1. Закройте это окно
    echo      2. Откройте Ubuntu из меню Пуск
    echo      3. Создайте пользователя (логин + пароль)
    echo      4. Запустите этот скрипт снова
    echo.
    pause
    exit /b 0
)
echo  [✓] Ubuntu доступна

:: ──────────────────────────────────────────────────────────
::  Step 4: Collect API keys
:: ──────────────────────────────────────────────────────────
echo.
echo  [3/8] Настройка ключей
echo  ──────────────────────────────────────────────────────
echo.

set "OPENAI_KEY="
set "TELEGRAM_TOKEN="
set "SUPABASE_URL="
set "SUPABASE_KEY="

set /p "OPENAI_KEY=  OpenAI API Key (sk-...): "
if "!OPENAI_KEY!"=="" (
    echo  [!] OpenAI API Key обязателен.
    pause
    exit /b 1
)

echo.
set /p "TELEGRAM_TOKEN=  Telegram Bot Token: "
if "!TELEGRAM_TOKEN!"=="" (
    echo  [!] Telegram Bot Token обязателен.
    pause
    exit /b 1
)

echo.
set /p "SUPABASE_URL=  Supabase URL (https://...supabase.co): "
if "!SUPABASE_URL!"=="" (
    echo  [!] Supabase URL обязателен.
    pause
    exit /b 1
)

echo.
set /p "SUPABASE_KEY=  Supabase Anon Key: "
if "!SUPABASE_KEY!"=="" (
    echo  [!] Supabase Anon Key обязателен.
    pause
    exit /b 1
)

echo.
echo  [✓] Ключи получены

:: ──────────────────────────────────────────────────────────
::  Step 5: Install Node.js 22 + OpenClaw in WSL
:: ──────────────────────────────────────────────────────────
echo.
echo  [4/8] Устанавливаю Node.js 22 и OpenClaw в WSL...
echo         (это может занять несколько минут)
echo.

wsl -d Ubuntu -- bash -c "set -e; export DEBIAN_FRONTEND=noninteractive; if command -v node >/dev/null 2>&1 && node -v | grep -q 'v22'; then echo '  Node.js 22 уже установлен'; else echo '  Устанавливаю Node.js 22...'; curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs; fi; echo; echo '  Устанавливаю OpenClaw...'; sudo npm install -g openclaw; echo; echo '  Node.js:' $(node -v); echo '  OpenClaw:' $(openclaw --version 2>/dev/null || echo 'installed')"

if %errorlevel% neq 0 (
    echo.
    echo  [!] Ошибка при установке. Проверьте подключение к интернету.
    pause
    exit /b 1
)
echo.
echo  [✓] Node.js и OpenClaw установлены

:: ──────────────────────────────────────────────────────────
::  Step 6: Write configs (openclaw.json + SKILL.md)
:: ──────────────────────────────────────────────────────────
echo.
echo  [5/8] Записываю конфигурацию...

wsl -d Ubuntu -- bash -c "mkdir -p ~/.openclaw && cat > ~/.openclaw/openclaw.json << 'JSONEOF'
{
  \"name\": \"koverbot\",
  \"model\": \"gpt-4o\",
  \"telegram\": {
    \"enabled\": true
  },
  \"supabase\": {
    \"enabled\": true
  },
  \"gateway\": {
    \"enabled\": true,
    \"port\": 3377
  }
}
JSONEOF"

if %errorlevel% neq 0 (
    echo  [!] Не удалось записать openclaw.json
    pause
    exit /b 1
)

wsl -d Ubuntu -- bash -c "cat > ~/.openclaw/SKILL.md << 'SKILLEOF'
# KoverBot

Ты — KoverBot, AI-ассистент для системы управления маршрутами Kover.

## Возможности
- Отвечай на вопросы о маршрутах, клиентах и остановках
- Помогай с планированием маршрутов
- Давай рекомендации по оптимизации

## Правила
- Отвечай на русском языке
- Будь кратким и полезным
- Если не знаешь ответ — скажи об этом
SKILLEOF"

if %errorlevel% neq 0 (
    echo  [!] Не удалось записать SKILL.md
    pause
    exit /b 1
)

echo  [✓] Конфигурация записана

:: ──────────────────────────────────────────────────────────
::  Step 7: Write secrets to systemd environment.d
:: ──────────────────────────────────────────────────────────
echo.
echo  [6/8] Записываю секреты...

:: Generate OPENCLAW_GATEWAY_TOKEN
for /f "delims=" %%i in ('wsl -d Ubuntu -- bash -c "openssl rand -hex 32"') do set "GATEWAY_TOKEN=%%i"

wsl -d Ubuntu -- bash -c "mkdir -p ~/.config/environment.d && cat > ~/.config/environment.d/openclaw.conf << ENVEOF
OPENAI_API_KEY=!OPENAI_KEY!
TELEGRAM_BOT_TOKEN=!TELEGRAM_TOKEN!
SUPABASE_URL=!SUPABASE_URL!
SUPABASE_ANON_KEY=!SUPABASE_KEY!
OPENCLAW_GATEWAY_TOKEN=!GATEWAY_TOKEN!
ENVEOF
chmod 600 ~/.config/environment.d/openclaw.conf"

if %errorlevel% neq 0 (
    echo  [!] Не удалось записать секреты
    pause
    exit /b 1
)

echo  [✓] Секреты записаны в ~/.config/environment.d/openclaw.conf

:: ──────────────────────────────────────────────────────────
::  Step 8: Setup systemd daemon
:: ──────────────────────────────────────────────────────────
echo.
echo  [7/8] Настраиваю systemd daemon...

wsl -d Ubuntu -- bash -c "set -e; export $(cat ~/.config/environment.d/openclaw.conf | xargs); openclaw onboard --install-daemon"

if %errorlevel% neq 0 (
    echo  [!] Не удалось настроить daemon.
    echo      Попробуйте вручную в WSL: openclaw onboard --install-daemon
    pause
    exit /b 1
)

echo  [✓] Daemon установлен

:: ──────────────────────────────────────────────────────────
::  Step 9: Create Windows Task Scheduler entry
:: ──────────────────────────────────────────────────────────
echo.
echo  [8/8] Настраиваю автозапуск...

schtasks /create /tn "KoverBot-WSL" /tr "wsl -d Ubuntu -- /bin/true" /sc onlogon /rl highest /f >nul 2>&1

if %errorlevel% neq 0 (
    echo  [!] Не удалось создать задачу автозапуска.
    echo      WSL может не запускаться автоматически при входе.
) else (
    echo  [✓] Автозапуск настроен (Task Scheduler: KoverBot-WSL)
)

:: ──────────────────────────────────────────────────────────
::  Step 10: Run doctor
:: ──────────────────────────────────────────────────────────
echo.
echo  ──────────────────────────────────────────────────────
echo   Проверка установки
echo  ──────────────────────────────────────────────────────
echo.

wsl -d Ubuntu -- bash -c "export $(cat ~/.config/environment.d/openclaw.conf | xargs); openclaw doctor"

:: ──────────────────────────────────────────────────────────
::  Done
:: ──────────────────────────────────────────────────────────
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║                                                      ║
echo  ║   Установка завершена!                               ║
echo  ║                                                      ║
echo  ║   Что дальше:                                        ║
echo  ║   1. Откройте Telegram                               ║
echo  ║   2. Найдите вашего бота                             ║
echo  ║   3. Отправьте /start                                ║
echo  ║                                                      ║
echo  ║   Бот запускается автоматически при входе в Windows.  ║
echo  ║                                                      ║
echo  ║   Управление:                                        ║
echo  ║     wsl -d Ubuntu -- openclaw status                 ║
echo  ║     wsl -d Ubuntu -- openclaw logs                   ║
echo  ║     wsl -d Ubuntu -- openclaw restart                ║
echo  ║                                                      ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
pause
