import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { DAY_LABELS } from '@/shared/types'
import type { DayOfWeek } from '@/shared/types'

interface ClientData {
  id: string
  isActive: boolean
  createdAt: string
}

interface RouteData {
  day: DayOfWeek
  stops: { clientId: string; skippedUntil?: string }[]
}

interface BusinessTrendsProps {
  clients: ClientData[]
  routes: RouteData[]
  maxStopsPerDay: number
}

export function BusinessTrends({ clients, routes, maxStopsPerDay }: BusinessTrendsProps) {
  const activeClients = useMemo(
    () => clients.filter((c) => c.isActive),
    [clients],
  )

  // Client growth trend (by month of creation)
  const monthlyGrowth = useMemo(() => {
    const months = new Map<string, number>()
    for (const c of clients) {
      const month = c.createdAt.slice(0, 7) // YYYY-MM
      months.set(month, (months.get(month) ?? 0) + 1)
    }
    return Array.from(months.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // last 6 months
      .map(([month, count]) => ({ month, count }))
  }, [clients])

  // Route load per day
  const routeLoad = useMemo(() => {
    const load: { day: DayOfWeek; stops: number; overloaded: boolean }[] = []
    for (const route of routes) {
      const activeStops = route.stops.filter((s) => {
        if (s.skippedUntil && s.skippedUntil > new Date().toISOString().slice(0, 10)) return false
        return true
      })
      load.push({
        day: route.day,
        stops: activeStops.length,
        overloaded: maxStopsPerDay > 0 && activeStops.length > maxStopsPerDay,
      })
    }
    return load.sort((a, b) => a.day - b.day)
  }, [routes, maxStopsPerDay])

  const overloadedDays = routeLoad.filter((d) => d.overloaded)

  const lastMonthClients = monthlyGrowth.at(-1)?.count ?? 0
  const prevMonthClients = monthlyGrowth.at(-2)?.count ?? 0
  const trend = lastMonthClients - prevMonthClients

  return (
    <div className="space-y-4">
      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border p-3">
          <p className="text-sm text-muted-foreground">Всего клиентов</p>
          <p className="text-2xl font-bold tabular-nums">{clients.length}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-sm text-muted-foreground">Активных</p>
          <p className="text-2xl font-bold tabular-nums text-emerald-400">{activeClients.length}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-sm text-muted-foreground">За последний месяц</p>
          <div className="flex items-center gap-1">
            <p className="text-2xl font-bold tabular-nums">{lastMonthClients}</p>
            {trend > 0 ? (
              <TrendingUp className="size-4 text-emerald-400" />
            ) : trend < 0 ? (
              <TrendingDown className="size-4 text-red-400" />
            ) : (
              <Minus className="size-4 text-muted-foreground" />
            )}
          </div>
        </div>
        <div className={cn(
          'rounded-lg border p-3',
          overloadedDays.length > 0 ? 'border-amber-500/40 bg-amber-500/5' : 'border-border',
        )}>
          <p className="text-sm text-muted-foreground">Перегруженные дни</p>
          <p className={cn('text-2xl font-bold tabular-nums', overloadedDays.length > 0 && 'text-amber-400')}>
            {overloadedDays.length}
          </p>
        </div>
      </div>

      {/* Overloaded routes warning */}
      {overloadedDays.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
          <AlertTriangle className="size-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-400">Перегрузка маршрутов</p>
            <p className="text-sm text-muted-foreground">
              {overloadedDays.map((d) => `${DAY_LABELS[d.day]}: ${d.stops} точек`).join(', ')} (порог: {maxStopsPerDay})
            </p>
          </div>
        </div>
      )}

      {/* Monthly client growth chart */}
      {monthlyGrowth.length > 1 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Новые клиенты по месяцам</h3>
          <div className="flex items-end gap-2">
            {monthlyGrowth.map(({ month, count }) => {
              const maxCount = Math.max(...monthlyGrowth.map((m) => m.count))
              const height = maxCount > 0 ? (count / maxCount) * 100 : 0
              const [, m] = month.split('-')
              const monthNames = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
              const label = monthNames[parseInt(m ?? '1', 10) - 1] ?? m

              return (
                <div key={month} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-sm tabular-nums text-muted-foreground">{count}</span>
                  <div
                    className="w-full rounded-t bg-blue-500/70"
                    style={{ height: `${Math.max(4, height)}px` }}
                  />
                  <span className="text-sm text-muted-foreground">{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Route load per day */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Загрузка по дням</h3>
        <div className="space-y-1">
          {routeLoad.map(({ day, stops, overloaded }) => {
            const maxStops = Math.max(...routeLoad.map((d) => d.stops), 1)
            const width = (stops / maxStops) * 100

            return (
              <div key={day} className="flex items-center gap-2">
                <span className="w-8 text-sm text-muted-foreground">{DAY_LABELS[day]}</span>
                <div className="flex-1">
                  <div
                    className={cn(
                      'h-5 rounded-sm',
                      overloaded ? 'bg-amber-500/70' : 'bg-blue-500/40',
                    )}
                    style={{ width: `${Math.max(2, width)}%` }}
                  />
                </div>
                <span className={cn(
                  'w-8 text-right text-sm tabular-nums',
                  overloaded ? 'font-semibold text-amber-400' : 'text-muted-foreground',
                )}>
                  {stops}
                </span>
              </div>
            )
          })}
        </div>
        {maxStopsPerDay > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">Порог перегрузки: {maxStopsPerDay} точек/день</p>
        )}
      </div>
    </div>
  )
}
