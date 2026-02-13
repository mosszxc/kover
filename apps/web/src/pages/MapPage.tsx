import { DaySwitcher } from '@/modules/routes'
import { RouteMap, useMapData, OptimizeRouteDialog } from '@/modules/map'

export function MapPage() {
  const stops = useMapData()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-50">Карта маршрута</h1>
        <OptimizeRouteDialog />
      </div>
      <DaySwitcher />
      <RouteMap stops={stops} />
    </div>
  )
}
