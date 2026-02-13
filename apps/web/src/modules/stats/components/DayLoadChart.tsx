import { DAY_LABELS } from '@/shared/types'
import { useWeeklyStats } from '../hooks/useWeeklyStats'

export function DayLoadChart() {
  const { days } = useWeeklyStats()

  const maxArea = Math.max(...days.map((d) => d.totalArea), 1)
  const maxStops = Math.max(...days.map((d) => d.stopCount), 1)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-50">Загрузка по дням</h2>

      <div className="space-y-6">
        {/* By area */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-400">По метражу (кв.м)</p>
          {days.map((day) => {
            const pct = (day.totalArea / maxArea) * 100
            const isMax = day.totalArea === maxArea
            return (
              <div key={day.day} className="flex items-center gap-3">
                <span className="w-8 text-sm font-medium text-slate-400">
                  {DAY_LABELS[day.day]}
                </span>
                <div className="flex-1">
                  <div
                    className={`h-6 rounded transition-all ${
                      isMax ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <span className="w-16 text-right text-sm tabular-nums text-slate-50">
                  {day.totalArea.toFixed(1)}
                </span>
              </div>
            )
          })}
        </div>

        {/* By stop count */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-400">По количеству точек</p>
          {days.map((day) => {
            const pct = (day.stopCount / maxStops) * 100
            const isMax = day.stopCount === maxStops
            return (
              <div key={day.day} className="flex items-center gap-3">
                <span className="w-8 text-sm font-medium text-slate-400">
                  {DAY_LABELS[day.day]}
                </span>
                <div className="flex-1">
                  <div
                    className={`h-6 rounded transition-all ${
                      isMax ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <span className="w-16 text-right text-sm tabular-nums text-slate-50">
                  {day.stopCount}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
