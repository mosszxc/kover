import { DaySwitcher } from '@/modules/routes'
import { RouteMap, useMapData } from '@/modules/map'

export function MapPage() {
  const stops = useMapData()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-50">Карта маршрута</h1>
      <DaySwitcher />
      <RouteMap stops={stops} />
    </div>
  )
}
