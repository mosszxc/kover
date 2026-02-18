import { useState } from 'react'
import { useRouteSettingsStore } from '@/shared/stores/routeSettingsStore'

export function MaxStopsPerDaySetting() {
  const maxStopsPerDay = useRouteSettingsStore((s) => s.maxStopsPerDay)
  const setMaxStopsPerDay = useRouteSettingsStore((s) => s.setMaxStopsPerDay)
  const [draft, setDraft] = useState(String(maxStopsPerDay))

  function commit(raw: string) {
    const n = parseInt(raw, 10)
    if (!Number.isNaN(n) && n >= 1 && n <= 999) {
      setMaxStopsPerDay(n)
      setDraft(String(n))
    } else {
      setDraft(String(maxStopsPerDay))
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Маршруты</h2>
        <p className="text-sm text-muted-foreground">
          Настройка параметров маршрутов и алертов
        </p>
      </div>

      <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-4 py-3">
        <div className="mr-4">
          <span className="text-sm font-medium text-foreground">
            Порог перегрузки маршрута
          </span>
          <p className="text-sm text-muted-foreground">
            Алерт сработает, если остановок в день больше этого числа
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={999}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit(draft)
            }}
            className="h-10 w-20 rounded-md border border-input bg-background px-3 text-center text-base text-foreground"
          />
        </div>
      </label>
    </div>
  )
}
