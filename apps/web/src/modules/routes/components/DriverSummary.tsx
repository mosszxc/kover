import { AlertTriangle, MapPin, LayoutGrid, User, Banknote, Truck } from 'lucide-react'
import { useDriverSummary } from '../hooks/useDriverSummary'
import type { DriverSummaryItem } from '../hooks/useDriverSummary'
import type { DriverOption } from './StopCard'

interface DriverSummaryProps {
  drivers: DriverOption[]
}

export function DriverSummary({ drivers }: DriverSummaryProps) {
  const items = useDriverSummary()

  if (items.length === 0) return null

  const driverMap = new Map(drivers.map((d) => [d.id, d]))
  const unassigned = items.find((i) => i.driverId === null)
  const assigned = items.filter((i) => i.driverId !== null)
  const hasCosts = items.some((i) => i.totalCost > 0)

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-muted-foreground">Нагрузка по водителям</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {unassigned && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/10">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-amber-400">Нераспределённые</p>
              <DriverStats item={unassigned} hasCosts={hasCosts} />
            </div>
          </div>
        )}
        {assigned.map((item) => {
          const driver = driverMap.get(item.driverId!)
          const capacity = driver?.vehicleCapacity
          const overloaded = capacity != null && capacity > 0 && item.totalArea > capacity
          return (
            <div
              key={item.driverId}
              className={`flex items-center gap-3 rounded-lg border p-2.5 ${
                overloaded
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-border bg-card/50'
              }`}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                <User className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {driver?.name ?? 'Неизвестный'}
                </p>
                <DriverStats item={item} hasCosts={hasCosts} capacity={capacity} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DriverStats({ item, hasCosts, capacity }: { item: DriverSummaryItem; hasCosts: boolean; capacity?: number | null }) {
  const overloaded = capacity != null && capacity > 0 && item.totalArea > capacity
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
      <span className="flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        {item.stopCount}
      </span>
      <span className="flex items-center gap-1">
        <LayoutGrid className="h-3 w-3" />
        {item.matCount} шт
      </span>
      <span className={`flex items-center gap-1 ${overloaded ? 'font-semibold text-red-400' : ''}`}>
        <Truck className="h-3 w-3" />
        {item.totalArea} м²
        {capacity != null && capacity > 0 && `/${capacity}`}
      </span>
      {overloaded && (
        <span className="flex items-center gap-1 text-red-400">
          <AlertTriangle className="h-3 w-3" />
          Перегруз
        </span>
      )}
      {hasCosts && (
        <span className="flex items-center gap-1 text-green-400">
          <Banknote className="h-3 w-3" />
          {item.totalCost} ₽
        </span>
      )}
    </div>
  )
}
