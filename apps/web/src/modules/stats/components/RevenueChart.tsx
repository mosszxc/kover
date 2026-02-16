import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useRevenueChart } from '../hooks/useRevenueChart'

export function RevenueChart() {
  const { months, hasCosts } = useRevenueChart()

  if (months.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card/50 p-4 text-center text-sm text-muted-foreground">
        Нет данных об оплатах
      </div>
    )
  }

  const hasAnyRevenue = months.some((m) => m.revenue > 0)
  if (!hasAnyRevenue) {
    return (
      <div className="rounded-lg border border-border bg-card/50 p-4 text-center text-sm text-muted-foreground">
        Нет данных об оплатах для графика выручки
      </div>
    )
  }

  const maxRevenue = Math.max(...months.map((m) => Math.max(m.revenue, m.expected)), 1)
  const current = months.at(-1)
  const previous = months.at(-2)

  const revenueDelta = current && previous ? current.revenue - previous.revenue : 0
  const revenueDeltaPct = previous?.revenue
    ? Math.round((revenueDelta / previous.revenue) * 100)
    : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Выручка по месяцам</h3>
        {current && previous && previous.revenue > 0 && (
          <div className="flex items-center gap-1.5">
            {revenueDelta > 0 ? (
              <TrendingUp className="size-4 text-emerald-400" />
            ) : revenueDelta < 0 ? (
              <TrendingDown className="size-4 text-red-400" />
            ) : (
              <Minus className="size-4 text-muted-foreground" />
            )}
            <span
              className={cn(
                'text-sm font-semibold tabular-nums',
                revenueDelta > 0 ? 'text-emerald-400' : revenueDelta < 0 ? 'text-red-400' : 'text-muted-foreground',
              )}
            >
              {revenueDelta > 0 ? '+' : ''}{revenueDelta.toLocaleString('ru-RU')} ₽
              <span className="ml-1 text-xs font-normal">
                ({revenueDeltaPct > 0 ? '+' : ''}{revenueDeltaPct}%)
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Key metrics */}
      <div className={cn('grid gap-3', hasCosts ? 'grid-cols-3' : 'grid-cols-2')}>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Текущий месяц</p>
          <p className="text-xl font-bold tabular-nums text-emerald-400">
            {(current?.revenue ?? 0).toLocaleString('ru-RU')} ₽
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Ожидается</p>
          <p className="text-xl font-bold tabular-nums">
            {(current?.expected ?? 0).toLocaleString('ru-RU')} ₽
          </p>
        </div>
        {hasCosts && (
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Маржа</p>
            <p className={cn(
              'text-xl font-bold tabular-nums',
              (current?.margin ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400',
            )}>
              {(current?.margin ?? 0).toLocaleString('ru-RU')} ₽
            </p>
          </div>
        )}
      </div>

      {/* Bar chart */}
      <div>
        <div className="flex items-end gap-1.5" style={{ height: '120px' }}>
          {months.map((month) => {
            const revenueH = (month.revenue / maxRevenue) * 100
            const expectedH = (month.expected / maxRevenue) * 100
            const isCurrent = month === current

            return (
              <div key={month.period} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {month.revenue > 0 ? `${Math.round(month.revenue / 1000)}k` : ''}
                </span>
                <div className="relative flex w-full flex-1 items-end justify-center gap-px">
                  {/* Expected (background) */}
                  <div
                    className="absolute bottom-0 w-full rounded-t bg-muted/60"
                    style={{ height: `${Math.max(2, expectedH)}%` }}
                  />
                  {/* Revenue (foreground) */}
                  <div
                    className={cn(
                      'relative z-10 w-full rounded-t',
                      isCurrent ? 'bg-emerald-500/80' : 'bg-emerald-500/50',
                    )}
                    style={{ height: `${Math.max(month.revenue > 0 ? 4 : 0, revenueH)}%` }}
                  />
                </div>
                <span className={cn(
                  'text-xs',
                  isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}>
                  {month.label}
                </span>
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm bg-emerald-500/60" />
            Оплачено
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm bg-muted/60" />
            Ожидается
          </span>
        </div>
      </div>

      {/* Margin chart if costs configured */}
      {hasCosts && months.some((m) => m.revenue > 0) && (
        <div>
          <h4 className="mb-2 text-xs font-medium text-muted-foreground">Маржа по месяцам</h4>
          <div className="space-y-1">
            {months.filter((m) => m.revenue > 0).map((month) => {
              const maxMargin = Math.max(...months.map((m) => Math.abs(m.margin)), 1)
              const width = Math.abs(month.margin) / maxMargin * 100
              const positive = month.margin >= 0

              return (
                <div key={month.period} className="flex items-center gap-2">
                  <span className="w-8 text-xs text-muted-foreground">{month.label}</span>
                  <div className="flex-1">
                    <div
                      className={cn(
                        'h-4 rounded-sm',
                        positive ? 'bg-emerald-500/40' : 'bg-red-500/40',
                      )}
                      style={{ width: `${Math.max(2, width)}%` }}
                    />
                  </div>
                  <span className={cn(
                    'w-16 text-right text-xs tabular-nums',
                    positive ? 'text-emerald-400' : 'text-red-400',
                  )}>
                    {month.margin.toLocaleString('ru-RU')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
