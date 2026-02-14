import { MapPin, Ruler, AlertTriangle, User, CirclePause } from 'lucide-react'
import { useRouteSummary } from '../hooks/useRouteSummary'
import { useDriverSummary } from '../hooks/useDriverSummary'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import { MAT_SIZE_STYLES } from '@/shared/constants'
import type { MatSize } from '@/shared/types'
import type { DriverOption } from './StopCard'

interface RouteDashboardProps {
  drivers: DriverOption[]
}

export function RouteDashboard({ drivers }: RouteDashboardProps) {
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

  const driverMap = new Map(drivers.map((d) => [d.id, d.name]))
  const unassigned = driverItems.find((i) => i.driverId === null)
  const assigned = driverItems.filter((i) => i.driverId !== null)
  const totalMats = Object.values(summary.matsBySize).reduce<number>((a, b) => a + (b ?? 0), 0)

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
      </div>

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
              <span className="mt-1 text-xs font-medium opacity-70">
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
            <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs">
              <AlertTriangle className="h-3 w-3 text-amber-400" />
              <span className="font-medium text-amber-400">Нераспред.</span>
              <span className="font-semibold tabular-nums text-amber-300">{unassigned.stopCount}</span>
              <span className="text-muted-foreground">/</span>
              <span className="tabular-nums text-muted-foreground">{unassigned.matCount} шт</span>
            </span>
          )}
          {assigned.map((item) => (
            <span
              key={item.driverId}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs"
            >
              <User className="h-3 w-3 text-blue-400" />
              <span className="font-medium text-foreground">{driverMap.get(item.driverId!) ?? '?'}</span>
              <span className="font-semibold tabular-nums text-foreground">{item.stopCount}</span>
              <span className="text-muted-foreground">/</span>
              <span className="tabular-nums text-muted-foreground">{item.matCount} шт</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
