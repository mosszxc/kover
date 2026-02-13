import { DAY_LABELS } from '@/shared/types'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import { useWeeklyStats } from '../hooks/useWeeklyStats'

export function WeeklySummary() {
  const { days, totals } = useWeeklyStats()
  const sizes = useMatSizeStore((s) => s.sizes)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-50">Недельная сводка</h2>

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full">
          <thead className="bg-slate-900">
            <tr>
              <th className="border-b border-slate-700 px-4 py-3 text-left text-sm font-medium text-slate-400">
                День
              </th>
              <th className="border-b border-slate-700 px-4 py-3 text-right text-sm font-medium text-slate-400">
                Точки
              </th>
              {sizes.map((s) => (
                <th
                  key={s.id}
                  className="border-b border-slate-700 px-4 py-3 text-right text-sm font-medium text-slate-400"
                >
                  {s.label}
                </th>
              ))}
              <th className="border-b border-slate-700 px-4 py-3 text-right text-sm font-medium text-slate-400">
                Кв.м
              </th>
            </tr>
          </thead>
          <tbody>
            {days.map((day, i) => (
              <tr
                key={day.day}
                className={`border-b border-slate-800 ${i % 2 === 1 ? 'bg-slate-900/50' : ''}`}
              >
                <td className="px-4 py-3 text-sm font-medium text-slate-50">
                  {DAY_LABELS[day.day]}
                </td>
                <td className="px-4 py-3 text-right text-sm tabular-nums text-slate-50">
                  {day.stopCount}
                </td>
                {sizes.map((s) => (
                  <td
                    key={s.id}
                    className="px-4 py-3 text-right text-sm tabular-nums text-slate-50"
                  >
                    {day.matsBySize[s.id] || ''}
                  </td>
                ))}
                <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-slate-50">
                  {day.totalArea.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-600 bg-slate-900">
              <td className="px-4 py-3 text-sm font-bold text-slate-50">
                Итого
              </td>
              <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-slate-50">
                {totals.stopCount}
              </td>
              {sizes.map((s) => (
                <td
                  key={s.id}
                  className="px-4 py-3 text-right text-sm font-bold tabular-nums text-slate-50"
                >
                  {totals.matsBySize[s.id] || ''}
                </td>
              ))}
              <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-slate-50">
                {totals.totalArea.toFixed(1)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
