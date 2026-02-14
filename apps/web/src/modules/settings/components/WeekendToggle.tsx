import { useSettingsStore } from '@/shared/stores/settingsStore'

export function WeekendToggle() {
  const showWeekends = useSettingsStore((s) => s.showWeekends)
  const setShowWeekends = useSettingsStore((s) => s.setShowWeekends)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-50">Рабочие дни</h2>
        <p className="text-sm text-slate-400">
          Управление отображением дней недели в интерфейсе
        </p>
      </div>

      <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-700 px-4 py-3">
        <div>
          <span className="text-sm font-medium text-slate-50">
            Показывать субботу и воскресенье
          </span>
          <p className="text-xs text-slate-400">
            Выходные дни будут скрыты из переключателя дней, фильтров и статистики
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={showWeekends}
          onClick={() => setShowWeekends(!showWeekends)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            showWeekends ? 'bg-blue-600' : 'bg-slate-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
              showWeekends ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </label>
    </div>
  )
}
