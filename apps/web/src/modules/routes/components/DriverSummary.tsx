import { AlertTriangle, MapPin, LayoutGrid, User } from 'lucide-react'
import { useDriverSummary } from '../hooks/useDriverSummary'
import type { DriverOption } from './StopCard'

interface DriverSummaryProps {
  drivers: DriverOption[]
}

export function DriverSummary({ drivers }: DriverSummaryProps) {
  const items = useDriverSummary()

  if (items.length === 0) return null

  const driverMap = new Map(drivers.map((d) => [d.id, d.name]))
  const unassigned = items.find((i) => i.driverId === null)
  const assigned = items.filter((i) => i.driverId !== null)

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">Нагрузка по водителям</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {unassigned && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/10">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-amber-400">Нераспределённые</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {unassigned.stopCount}
                </span>
                <span className="flex items-center gap-1">
                  <LayoutGrid className="h-3 w-3" />
                  {unassigned.matCount} шт
                </span>
              </div>
            </div>
          </div>
        )}
        {assigned.map((item) => (
          <div
            key={item.driverId}
            className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-2.5"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
              <User className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {driverMap.get(item.driverId!) ?? 'Неизвестный'}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {item.stopCount}
                </span>
                <span className="flex items-center gap-1">
                  <LayoutGrid className="h-3 w-3" />
                  {item.matCount} шт
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
