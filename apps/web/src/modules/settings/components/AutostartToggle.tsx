import { useEffect } from 'react'
import { useSettingsStore } from '@/shared/stores/settingsStore'
import { isTauri } from '@/shared/lib/platform'

export function AutostartToggle() {
  const autostartEnabled = useSettingsStore((s) => s.autostartEnabled)
  const setAutostartEnabled = useSettingsStore((s) => s.setAutostartEnabled)
  const startMinimized = useSettingsStore((s) => s.startMinimized)
  const setStartMinimized = useSettingsStore((s) => s.setStartMinimized)

  // Sync autostart state with OS on mount
  useEffect(() => {
    if (!isTauri()) return
    let cancelled = false

    import('@tauri-apps/plugin-autostart').then(({ isEnabled }) => {
      isEnabled().then((osEnabled) => {
        if (!cancelled && osEnabled !== autostartEnabled) {
          setAutostartEnabled(osEnabled)
        }
      })
    })

    return () => {
      cancelled = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isTauri()) return null

  async function handleAutostartToggle() {
    const next = !autostartEnabled
    const { enable, disable } = await import('@tauri-apps/plugin-autostart')

    if (next) {
      await enable()
    } else {
      await disable()
      setStartMinimized(false)
    }
    setAutostartEnabled(next)
  }

  function handleMinimizedToggle() {
    setStartMinimized(!startMinimized)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-50">Автозапуск</h2>
        <p className="text-sm text-slate-400">
          Kover будет запускаться автоматически при входе в Windows
        </p>
      </div>

      <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-700 px-4 py-3">
        <div>
          <span className="text-sm font-medium text-slate-50">
            Запускать с Windows
          </span>
          <p className="text-xs text-slate-400">
            Kover стартует при входе в систему
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={autostartEnabled}
          onClick={handleAutostartToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            autostartEnabled ? 'bg-blue-600' : 'bg-slate-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
              autostartEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </label>

      {autostartEnabled && (
        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-700 px-4 py-3">
          <div>
            <span className="text-sm font-medium text-slate-50">
              Запускать свёрнутым
            </span>
            <p className="text-xs text-slate-400">
              Окно скрыто в трей, доступ через иконку в панели задач
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={startMinimized}
            onClick={handleMinimizedToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              startMinimized ? 'bg-blue-600' : 'bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                startMinimized ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
      )}
    </div>
  )
}
