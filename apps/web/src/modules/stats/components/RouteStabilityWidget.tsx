import { useState } from 'react'
import { Activity } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { DAY_LABELS } from '@/shared/types'
import { useRouteStability } from '../hooks/useRouteStability'
import type { StabilityLevel } from '../hooks/useRouteStability'

const PERIOD_OPTIONS = [
  { label: '2 нед', value: 2 },
  { label: '4 нед', value: 4 },
  { label: '8 нед', value: 8 },
] as const

const LEVEL_STYLES: Record<StabilityLevel, { bg: string; text: string; label: string }> = {
  stable: { bg: 'bg-green-600/20', text: 'text-green-400', label: 'Стабильный' },
  moderate: { bg: 'bg-amber-600/20', text: 'text-amber-400', label: 'Умеренные изменения' },
  unstable: { bg: 'bg-red-600/20', text: 'text-red-400', label: 'Частые изменения' },
}

export function RouteStabilityWidget() {
  const [weeksBack, setWeeksBack] = useState(4)
  const { days, overallPct, overallLevel } = useRouteStability(weeksBack)

  const overallStyle = LEVEL_STYLES[overallLevel]

  // Only show days that have stops
  const activeDays = days.filter((d) => d.totalStops > 0)

  if (activeDays.length === 0) return null

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="size-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-foreground">Стабильность маршрутов</h3>
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', overallStyle.bg, overallStyle.text)}>
            {overallPct}%
          </span>
        </div>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setWeeksBack(opt.value)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                weeksBack === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {activeDays.map((d) => {
          const style = LEVEL_STYLES[d.level]
          return (
            <div
              key={d.day}
              className={cn(
                'flex flex-col items-center rounded-lg border px-3 py-2.5',
                d.level === 'stable' && 'border-green-500/30 bg-green-500/5',
                d.level === 'moderate' && 'border-amber-500/30 bg-amber-500/5',
                d.level === 'unstable' && 'border-red-500/30 bg-red-500/5',
              )}
            >
              <span className="text-sm font-medium text-foreground">{DAY_LABELS[d.day]}</span>
              <span className={cn('mt-1 text-2xl font-bold tabular-nums', style.text)}>
                {d.stabilityPct}%
              </span>
              <span className="mt-0.5 text-center text-xs text-muted-foreground">
                {d.changedClients} из {d.totalStops}
              </span>
              <span className={cn('mt-1 text-xs font-medium', style.text)}>
                {style.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
