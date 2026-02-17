import { MapPin, Truck, SkipForward } from 'lucide-react'
import { Link } from 'react-router'
import type { RouteBriefing } from '../types'

interface RouteCardProps {
  route: RouteBriefing
  todayLabel: string
}

export function RouteCard({ route, todayLabel }: RouteCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Маршрут — {todayLabel}
        </h2>
        <Link
          to="/"
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          Открыть
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-emerald-400" />
          <div>
            <div className="text-2xl font-bold text-foreground">{route.activeStops}</div>
            <div className="text-xs text-muted-foreground">остановок</div>
          </div>
        </div>

        {route.skippedStops > 0 && (
          <div className="flex items-center gap-2">
            <SkipForward className="size-4 text-amber-400" />
            <div>
              <div className="text-2xl font-bold text-foreground">{route.skippedStops}</div>
              <div className="text-xs text-muted-foreground">пропущено</div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Truck className="size-4 text-blue-400" />
          <div>
            <div className="text-2xl font-bold text-foreground">{route.drivers.length}</div>
            <div className="text-xs text-muted-foreground">
              {route.drivers.length === 1 ? 'водитель' : 'водителей'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="size-4 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
            M
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{route.totalMatsSqm}</div>
            <div className="text-xs text-muted-foreground">ковриков</div>
          </div>
        </div>
      </div>

      {route.drivers.length > 0 && (
        <div className="mt-3 text-sm text-muted-foreground">
          {route.drivers.join(', ')}
        </div>
      )}
    </div>
  )
}
