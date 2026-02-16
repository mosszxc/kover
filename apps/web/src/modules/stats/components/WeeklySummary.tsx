import { DAY_LABELS } from '@/shared/types'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import { useWeeklyStats } from '../hooks/useWeeklyStats'

export function WeeklySummary() {
  const { days, totals, hasPrices } = useWeeklyStats()
  const sizes = useMatSizeStore((s) => s.sizes)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Недельная сводка</h2>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead className="bg-card">
            <tr>
              <th className="border-b border-border px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                День
              </th>
              <th className="border-b border-border px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                Точки
              </th>
              {sizes.map((s) => (
                <th
                  key={s.id}
                  className="border-b border-border px-4 py-3 text-right text-sm font-medium text-muted-foreground"
                >
                  {s.label}
                </th>
              ))}
              <th className="border-b border-border px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                Кв.м
              </th>
              {hasPrices && (
                <th className="border-b border-border px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  Выручка
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {days.map((day, i) => (
              <tr
                key={day.day}
                className={`border-b border-border ${i % 2 === 1 ? 'bg-card/50' : ''}`}
              >
                <td className="px-4 py-3 text-sm font-medium text-foreground">
                  {DAY_LABELS[day.day]}
                </td>
                <td className="px-4 py-3 text-right text-sm tabular-nums text-foreground">
                  {day.stopCount}
                </td>
                {sizes.map((s) => (
                  <td
                    key={s.id}
                    className="px-4 py-3 text-right text-sm tabular-nums text-foreground"
                  >
                    {day.matsBySize[s.id] || ''}
                  </td>
                ))}
                <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-foreground">
                  {day.totalArea.toFixed(1)}
                </td>
                {hasPrices && (
                  <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-green-400">
                    {day.totalCost.toLocaleString('ru-RU')} ₽
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-card">
              <td className="px-4 py-3 text-sm font-bold text-foreground">
                Итого
              </td>
              <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-foreground">
                {totals.stopCount}
              </td>
              {sizes.map((s) => (
                <td
                  key={s.id}
                  className="px-4 py-3 text-right text-sm font-bold tabular-nums text-foreground"
                >
                  {totals.matsBySize[s.id] || ''}
                </td>
              ))}
              <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-foreground">
                {totals.totalArea.toFixed(1)}
              </td>
              {hasPrices && (
                <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-green-400">
                  {totals.totalCost.toLocaleString('ru-RU')} ₽
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
