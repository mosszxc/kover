import { Link } from 'react-router'
import { MapPin, AlertTriangle } from 'lucide-react'
import { DaySwitcher } from '@/modules/routes'
import { RouteMap, useMapData, OptimizeRouteDialog } from '@/modules/map'

export function MapPage() {
  const { stops, totalActive, withoutCoords } = useMapData()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Карта маршрута</h1>
        <OptimizeRouteDialog />
      </div>
      <DaySwitcher />
      {totalActive > 0 && withoutCoords > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm">
          <AlertTriangle className="size-4 shrink-0 text-amber-500" />
          <span className="text-foreground">
            <MapPin className="mr-1 inline size-3.5 align-text-bottom" />
            {stops.length} из {totalActive} на карте
            <span className="text-muted-foreground"> · {withoutCoords} без координат</span>
          </span>
          <Link
            to="/clients"
            className="ml-auto shrink-0 text-sm font-medium text-amber-500 hover:underline"
          >
            Геокодировать
          </Link>
        </div>
      )}
      <RouteMap stops={stops} />
    </div>
  )
}
