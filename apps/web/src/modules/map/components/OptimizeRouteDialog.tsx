import { useState, useEffect } from 'react'
import { Route, Check, Loader2 } from 'lucide-react'
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
import { optimizeRouteAsync, type OptimizationResult } from '@/shared/lib/tsp'
import { useRouteStore } from '@/modules/routes'
import { useClientStore } from '@/modules/clients'

export function OptimizeRouteDialog() {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<OptimizationResult | null>(null)
  const [loading, setLoading] = useState(false)

  const routes = useRouteStore((s) => s.routes)
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const reorderAllStops = useRouteStore((s) => s.reorderAllStops)
  const clients = useClientStore((s) => s.clients)

  useEffect(() => {
    if (!open) {
      setResult(null)
      return
    }

    const clientMap = new Map(clients.map((c) => [c.id, c]))
    const dayRoute = routes.find((r) => r.day === selectedDay)
    if (!dayRoute) return

    const points = dayRoute.stops
      .filter((stop) => {
        const client = clientMap.get(stop.clientId)
        return client?.isActive && client.lat != null && client.lng != null
      })
      .map((stop) => {
        const client = clientMap.get(stop.clientId)!
        return { id: stop.id, lat: client.lat!, lng: client.lng! }
      })

    if (points.length < 3) return

    let cancelled = false
    setLoading(true)

    optimizeRouteAsync(points).then((res) => {
      if (!cancelled) {
        setResult(res)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
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

        {loading && (
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <p className="text-sm text-slate-400">Рассчитываем оптимальный маршрут...</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <div className="text-sm text-muted-foreground">Сейчас</div>
                <div className="text-xl font-bold tabular-nums text-foreground">
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

            <p className="text-sm text-muted-foreground">
              Оптимизировано {result.optimizedIds.length} точек с координатами.
              Точки без координат останутся в конце маршрута.
            </p>

            <p className="text-xs text-slate-500">
              Метод: {result.method === 'road' ? 'по дорогам (OSRM)' : 'по прямой (fallback)'}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleApply} disabled={loading || !result || result.savingPercent === 0}>
            Применить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
