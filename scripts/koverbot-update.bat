@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

:: ════════════════════════════════════════════════════════════
::  KoverBot Updater — обновление OpenClaw в WSL2
:: ════════════════════════════════════════════════════════════

title KoverBot Updater

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║                                                      ║
echo  ║   KoverBot Updater                                   ║
echo  ║   Обновление OpenClaw в WSL2                         ║
echo  ║                                                      ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

:: ──────────────────────────────────────────────────────────
::  Check WSL + Ubuntu
:: ──────────────────────────────────────────────────────────
echo  [1/4] Проверяю WSL2...

wsl -d Ubuntu -- echo ok >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] Ubuntu в WSL2 не найдена.
    echo      Сначала запустите koverbot-install.bat
    echo.
    pause
    exit /b 1
)
echo  [✓] WSL2 + Ubuntu

:: ──────────────────────────────────────────────────────────
::  Show current version
:: ──────────────────────────────────────────────────────────
echo.
echo  Текущая версия:
wsl -d Ubuntu -- bash -c "openclaw --version 2>/dev/null || echo '  не определена'"

:: ──────────────────────────────────────────────────────────
::  Update OpenClaw
:: ──────────────────────────────────────────────────────────
echo.
echo  [2/4] Обновляю OpenClaw...

wsl -d Ubuntu -- bash -c "sudo npm update -g openclaw"

if %errorlevel% neq 0 (
    echo  [!] Ошибка при обновлении. Проверьте подключение к интернету.
    pause
    exit /b 1
)

echo.
echo  Новая версия:
wsl -d Ubuntu -- bash -c "openclaw --version 2>/dev/null || echo '  не определена'"
echo.
echo  [✓] OpenClaw обновлён

:: ──────────────────────────────────────────────────────────
::  Restart systemd service
:: ──────────────────────────────────────────────────────────
echo.
echo  [3/4] Перезапускаю сервис...

wsl -d Ubuntu -- bash -c "systemctl --user restart openclaw-gateway 2>/dev/null || echo '  Сервис не найден — пропускаю перезапуск'"

echo  [✓] Сервис перезапущен

:: ──────────────────────────────────────────────────────────
::  Health check
:: ──────────────────────────────────────────────────────────
echo.
echo  [4/4] Проверка здоровья...
echo.

wsl -d Ubuntu -- bash -c "export $(cat ~/.config/environment.d/openclaw.conf 2>/dev/null | xargs); openclaw doctor"

:: ──────────────────────────────────────────────────────────
::  Done
:: ──────────────────────────────────────────────────────────
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║                                                      ║
echo  ║   KoverBot обновлён!                                 ║
echo  ║                                                      ║
echo  ║   Конфигурация и секреты не изменены.                ║
echo  ║                                                      ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
pause
