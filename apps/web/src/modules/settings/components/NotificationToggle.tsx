import { useSettingsStore } from '@/shared/stores/settingsStore'
import { isTauri } from '@/shared/lib/platform'
import { requestNotificationPermission } from '@/shared/lib/notifications'

export function NotificationToggle() {
  const enabled = useSettingsStore((s) => s.notificationsEnabled)
  const setEnabled = useSettingsStore((s) => s.setNotificationsEnabled)

  async function handleToggle() {
    const next = !enabled
    if (next && isTauri()) {
      await requestNotificationPermission()
    }
    setEnabled(next)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-50">Уведомления</h2>
        <p className="text-sm text-slate-400">
          {isTauri()
            ? 'Системные уведомления Windows при важных событиях'
            : 'Всплывающие уведомления внутри приложения'}
        </p>
      </div>

      <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-700 px-4 py-3">
        <div>
          <span className="text-sm font-medium text-slate-50">
            Показывать уведомления
          </span>
          <p className="text-xs text-slate-400">
            Ошибки синхронизации, обновления приложения и другие важные события
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            enabled ? 'bg-blue-600' : 'bg-slate-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </label>
    </div>
  )
}
