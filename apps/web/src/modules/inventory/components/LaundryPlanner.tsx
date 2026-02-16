import { AlertTriangle, WashingMachine } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { DAY_LABELS } from '@/shared/types'
import type { DayOfWeek } from '@/shared/types'
import type { SizeForecast } from '../hooks/useLaundryForecast'

const DAYS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6]

interface LaundryPlannerProps {
  forecasts: SizeForecast[]
  sizeLabels: Map<string, string>
}

export function LaundryPlanner({ forecasts, sizeLabels }: LaundryPlannerProps) {
  const hasData = forecasts.some((f) => f.weekDemand.some((d) => d > 0))
  const hasShortages = forecasts.some((f) => f.shortages.length > 0)

  if (!hasData) {
    return (
      <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
        <WashingMachine className="mx-auto mb-2 size-8 opacity-50" />
        Нет данных для прогноза. Добавьте инвентарь и маршруты.
      </div>
    )
  }

  const today = new Date().getDay()
  // JS Sunday=0, our system Monday=0
  const currentDay = today === 0 ? 6 : today - 1

  return (
    <div className="space-y-4">
      {hasShortages && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/5 p-3">
          <AlertTriangle className="size-5 shrink-0 text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-400">Не хватает ковриков</p>
            <p className="text-xs text-muted-foreground">
              {forecasts
                .filter((f) => f.shortages.length > 0)
                .map((f) => {
                  const label = sizeLabels.get(f.sizeId) ?? f.sizeId
                  const days = f.shortages.map((s) => DAY_LABELS[s.day as DayOfWeek]).join(', ')
                  return `${label}: ${days}`
                })
                .join('; ')}
            </p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-4 text-left font-medium text-muted-foreground">Размер</th>
              <th className="px-2 py-2 text-center font-medium text-muted-foreground">Склад</th>
              <th className="px-2 py-2 text-center font-medium text-muted-foreground">Стирка</th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className={cn(
                    'px-2 py-2 text-center font-medium',
                    day === currentDay ? 'text-blue-400' : 'text-muted-foreground',
                  )}
                >
                  {DAY_LABELS[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {forecasts
              .filter((f) => f.weekDemand.some((d) => d > 0) || f.inStock > 0)
              .map((forecast) => {
                const label = sizeLabels.get(forecast.sizeId) ?? forecast.sizeId
                const shortDays = new Set(forecast.shortages.map((s) => s.day))

                return (
                  <tr key={forecast.sizeId} className="border-b border-border/50">
                    <td className="py-2 pr-4 font-medium text-foreground">{label}</td>
                    <td className="px-2 py-2 text-center tabular-nums text-foreground">
                      {forecast.inStock}
                    </td>
                    <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">
                      {forecast.inLaundry}
                    </td>
                    {forecast.weekDemand.map((demand, dayIdx) => {
                      const isShort = shortDays.has(dayIdx as any)
                      const isToday = dayIdx === currentDay
                      return (
                        <td
                          key={dayIdx}
                          className={cn(
                            'px-2 py-2 text-center tabular-nums',
                            isShort && 'font-semibold text-red-400',
                            isToday && !isShort && 'font-semibold text-blue-400',
                            !isShort && !isToday && (demand > 0 ? 'text-foreground' : 'text-muted-foreground'),
                          )}
                        >
                          {demand > 0 ? demand : '—'}
                          {isShort && (
                            <span className="ml-0.5 text-xs text-red-400">!</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Потребность рассчитана по активным маршрутам. Красным отмечены дни с нехваткой (потребность &gt; склад).
      </p>
    </div>
  )
}
