import { MapPin, Ruler, AlertTriangle, User, CirclePause, Check, SkipForward, AlertCircle, Activity } from 'lucide-react'
import { useRouteSummary } from '../hooks/useRouteSummary'
import { useDriverSummary } from '../hooks/useDriverSummary'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import { MAT_SIZE_STYLES } from '@/shared/constants'
import { cn } from '@/shared/lib/utils'
import type { MatSize } from '@/shared/types'
import type { DriverOption } from './StopCard'

export interface ExecutionSummary {
  total: number
  completed: number
  skipped: number
  problem: number
}

export interface StabilityInfo {
  stabilityPct: number
  level: 'stable' | 'moderate' | 'unstable'
}

interface RouteDashboardProps {
  drivers: DriverOption[]
  executionSummary?: ExecutionSummary
  stability?: StabilityInfo
}

const STABILITY_STYLES = {
  stable: { bg: 'bg-green-600/20', text: 'text-green-400', icon: 'text-green-400' },
  moderate: { bg: 'bg-amber-600/20', text: 'text-amber-400', icon: 'text-amber-400' },
  unstable: { bg: 'bg-red-600/20', text: 'text-red-400', icon: 'text-red-400' },
}

export function RouteDashboard({ drivers, executionSummary, stability }: RouteDashboardProps) {
  const summary = useRouteSummary()
  const driverItems = useDriverSummary()
  const sizes = useMatSizeStore((s) => s.sizes)

  if (summary.stopCount === 0) {
    return (
      <div className="rounded-lg border border-border bg-card/50 p-4 text-center text-sm text-muted-foreground">
        Нет точек на этот день
      </div>
    )
  }

  const driverMap = new Map(drivers.map((d) => [d.id, d]))
  const unassigned = driverItems.find((i) => i.driverId === null)
  const assigned = driverItems.filter((i) => i.driverId !== null)
  const totalMats = Object.values(summary.matsBySize).reduce<number>((a, b) => a + (b ?? 0), 0)

  const hasExecution = executionSummary && executionSummary.total > 0
  const executedCount = hasExecution ? executionSummary.completed + executionSummary.skipped + executionSummary.problem : 0
  const progressPct = hasExecution ? Math.round((executionSummary.completed / executionSummary.total) * 100) : 0

  const stabStyle = stability ? STABILITY_STYLES[stability.level] : null

  return (
    <div className="rounded-lg border border-border bg-card/50">
      {/* Row 1: Stops + Area — compact side metrics */}
      <div className="flex items-center gap-4 px-4 pt-3 pb-2 text-sm">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-blue-400" />
          <span className="font-semibold tabular-nums text-foreground">{summary.stopCount}</span>
          <span className="text-muted-foreground">точек</span>
        </span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-1.5">
          <Ruler className="h-3.5 w-3.5 text-amber-400" />
          <span className="font-semibold tabular-nums text-foreground">{summary.totalArea}</span>
          <span className="text-muted-foreground">м²</span>
        </span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-1.5">
          <span className="font-semibold tabular-nums text-foreground">{totalMats}</span>
          <span className="text-muted-foreground">шт всего</span>
        </span>
        {summary.skippedCount > 0 && (
          <>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1.5">
              <CirclePause className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-semibold tabular-nums text-muted-foreground">{summary.skippedCount}</span>
              <span className="text-muted-foreground">пропущено</span>
            </span>
          </>
        )}
        {stability && stabStyle && (
          <>
            <span className="text-border">|</span>
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', stabStyle.bg, stabStyle.text)}>
              <Activity className={cn('size-3', stabStyle.icon)} />
              {stability.stabilityPct}%
            </span>
          </>
        )}
      </div>

      {/* Execution progress bar */}
      {hasExecution && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-muted-foreground">Выполнение</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {executionSummary.completed}/{executionSummary.total}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {executionSummary.completed > 0 && (
                <span className="flex items-center gap-1 text-green-500">
                  <Check className="size-3" />
                  {executionSummary.completed}
                </span>
              )}
              {executionSummary.skipped > 0 && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <SkipForward className="size-3" />
                  {executionSummary.skipped}
                </span>
              )}
              {executionSummary.problem > 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <AlertCircle className="size-3" />
                  {executionSummary.problem}
                </span>
              )}
              {executedCount < executionSummary.total && (
                <span className="text-muted-foreground">
                  {executionSummary.total - executedCount} осталось
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Row 2: Mat sizes — hero section */}
      <div className="flex gap-2 px-4 pb-3">
        {sizes.map((s) => {
          const qty = summary.matsBySize[s.id] ?? 0
          if (qty === 0) return null
          const style = MAT_SIZE_STYLES[s.id as MatSize]
          return (
            <div
              key={s.id}
              className={`flex flex-1 flex-col items-center rounded-lg py-2.5 px-2 ${style?.summary ?? 'bg-muted ring-1 ring-border'}`}
            >
              <span className="text-2xl font-bold tabular-nums leading-none">
                {qty}
              </span>
              <span className="mt-1 text-sm font-medium opacity-70">
                {s.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Row 3: Drivers */}
      {driverItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-2.5">
          {unassigned && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-sm">
              <AlertTriangle className="h-3 w-3 text-amber-400" />
              <span className="font-medium text-amber-400">Нераспред.</span>
              <span className="font-semibold tabular-nums text-amber-300">{unassigned.stopCount}</span>
              <span className="text-muted-foreground">/</span>
              <span className="tabular-nums text-muted-foreground">{unassigned.matCount} шт</span>
              <span className="text-muted-foreground">/</span>
              <span className="tabular-nums text-amber-400">{unassigned.totalArea} м²</span>
            </span>
          )}
          {assigned.map((item) => {
            const driver = driverMap.get(item.driverId!)
            const capacity = driver?.vehicleCapacity
            const overloaded = capacity != null && capacity > 0 && item.totalArea > capacity
            return (
              <span
                key={item.driverId}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm ${
                  overloaded
                    ? 'border-red-500/30 bg-red-500/10'
                    : 'border-border bg-muted/40'
                }`}
              >
                <User className="h-3 w-3 text-blue-400" />
                <span className="font-medium text-foreground">{driver?.name ?? '?'}</span>
                <span className="font-semibold tabular-nums text-foreground">{item.stopCount}</span>
                <span className="text-muted-foreground">/</span>
                <span className="tabular-nums text-muted-foreground">{item.totalArea} м²</span>
                {capacity != null && capacity > 0 && (
                  <span className={`tabular-nums ${overloaded ? 'text-red-400' : 'text-muted-foreground'}`}>/{capacity}</span>
                )}
                {overloaded && <AlertTriangle className="h-3 w-3 text-red-400" />}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
