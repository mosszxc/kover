import { useState, useMemo } from 'react'
import { Route, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { optimizeRoute } from '@/shared/lib/tsp'
import { useRouteStore } from '@/modules/routes'
import { useClientStore } from '@/modules/clients'

export function OptimizeRouteDialog() {
  const [open, setOpen] = useState(false)

  const routes = useRouteStore((s) => s.routes)
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const reorderAllStops = useRouteStore((s) => s.reorderAllStops)
  const clients = useClientStore((s) => s.clients)

  const result = useMemo(() => {
    if (!open) return null

    const clientMap = new Map(clients.map((c) => [c.id, c]))
    const dayRoute = routes.find((r) => r.day === selectedDay)
    if (!dayRoute) return null

    const points = dayRoute.stops
      .filter((stop) => {
        const client = clientMap.get(stop.clientId)
        return client?.isActive && client.lat != null && client.lng != null
      })
      .map((stop) => {
        const client = clientMap.get(stop.clientId)!
        return { id: stop.id, lat: client.lat!, lng: client.lng! }
      })

    if (points.length < 3) return null

    return optimizeRoute(points)
  }, [open, routes, selectedDay, clients])

  function handleApply() {
    if (!result) return
    reorderAllStops(selectedDay, result.optimizedIds)
    toast.success('Порядок маршрута оптимизирован', {
      action: {
        label: 'Отменить',
        onClick: () => {
          useRouteStore.temporal.getState().undo()
          toast.info('Оптимизация отменена')
        },
      },
    })
    setOpen(false)
  }

  const clientMap = new Map(clients.map((c) => [c.id, c]))
  const dayRoute = routes.find((r) => r.day === selectedDay)
  const stopCount = dayRoute?.stops.filter((s) => {
    const c = clientMap.get(s.clientId)
    return c?.isActive
  }).length ?? 0
  const geocodedCount = dayRoute?.stops.filter((s) => {
    const c = clientMap.get(s.clientId)
    return c?.isActive && c.lat != null
  }).length ?? 0

  const canOptimize = geocodedCount >= 3

  if (stopCount === 0) return null

  return (
    <Dialog open={open} onOpenChange={canOptimize ? setOpen : undefined}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={!canOptimize}
          title={!canOptimize ? 'Нужны координаты минимум у 3 точек' : undefined}
        >
          <Route className="h-4 w-4" />
          Оптимизировать
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Оптимизация маршрута</DialogTitle>
        </DialogHeader>

        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-center">
                <div className="text-sm text-slate-400">Сейчас</div>
                <div className="text-xl font-bold tabular-nums text-slate-50">
                  {result.originalDistance.toFixed(1)} км
                </div>
              </div>
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-center">
                <div className="text-sm text-green-400">После</div>
                <div className="text-xl font-bold tabular-nums text-green-400">
                  {result.optimizedDistance.toFixed(1)} км
                </div>
              </div>
            </div>

            {result.savingPercent > 0 && (
              <div className="flex items-center justify-center gap-2 text-green-400">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Экономия: {result.savingPercent.toFixed(0)}%
                </span>
              </div>
            )}

            <p className="text-sm text-slate-400">
              Оптимизировано {result.optimizedIds.length} точек с координатами.
              Точки без координат останутся в конце маршрута.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleApply} disabled={!result || result.savingPercent === 0}>
            Применить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
