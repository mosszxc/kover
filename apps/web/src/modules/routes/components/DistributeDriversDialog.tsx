import { useState, useMemo, useCallback } from 'react'
import { Split, Loader2, Users, MapPin, Ruler } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { cn } from '@/shared/lib/utils'
import { clusterPoints, type Cluster, type GeoPoint } from '@/shared/lib/clustering'
import { getMatArea } from '@/shared/stores/matSizeStore'
import { useRouteStore } from '../store'
import { isStopSkipped } from '../utils'
import type { DriverOption } from './StopCard'
import type { Client } from '@/modules/clients'

/** Цвета для визуального разделения кластеров */
const CLUSTER_COLORS = [
  { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400', dot: 'bg-blue-500' },
  { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400', dot: 'bg-amber-500' },
  { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400', dot: 'bg-purple-500' },
  { bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-400', dot: 'bg-rose-500' },
  { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400', dot: 'bg-cyan-500' },
]

interface DistributeDriversDialogProps {
  drivers: DriverOption[]
  clients: Client[]
}

interface ClusterPreview {
  driverId: string
  driverName: string
  stopIds: string[]
  stopCount: number
  totalArea: number
  colorIndex: number
}

export function DistributeDriversDialog({ drivers, clients }: DistributeDriversDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([])
  const [preview, setPreview] = useState<ClusterPreview[] | null>(null)
  const [loading, setLoading] = useState(false)

  const selectedDay = useRouteStore((s) => s.selectedDay)
  const routes = useRouteStore((s) => s.routes)
  const assignDriverBulk = useRouteStore((s) => s.assignDriverBulk)

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients])

  // Водители, работающие в этот день
  const availableDrivers = useMemo(
    () => drivers.filter((d) => d.workDays.includes(selectedDay)),
    [drivers, selectedDay],
  )

  // Активные остановки с координатами
  const geoStops = useMemo(() => {
    const dayRoute = routes.find((r) => r.day === selectedDay)
    if (!dayRoute) return []

    return dayRoute.stops
      .filter((s) => {
        if (isStopSkipped(s)) return false
        const client = clientMap.get(s.clientId)
        return client?.isActive && client.lat != null && client.lng != null
      })
      .map((s) => {
        const client = clientMap.get(s.clientId)!
        const area = client.mats.reduce(
          (sum, m) => sum + m.quantity * getMatArea(m.size),
          0,
        )
        return {
          stopId: s.id,
          clientId: s.clientId,
          lat: client.lat!,
          lng: client.lng!,
          area,
        }
      })
  }, [routes, selectedDay, clientMap])

  const toggleDriver = useCallback((driverId: string) => {
    setSelectedDriverIds((prev) =>
      prev.includes(driverId)
        ? prev.filter((id) => id !== driverId)
        : [...prev, driverId],
    )
    setPreview(null)
  }, [])

  const handleDistribute = useCallback(() => {
    if (selectedDriverIds.length < 2 || geoStops.length === 0) return

    setLoading(true)

    // Запуск в следующем тике для отрисовки загрузки
    setTimeout(() => {
      const points: GeoPoint[] = geoStops.map((s) => ({
        id: s.stopId,
        lat: s.lat,
        lng: s.lng,
        weight: s.area,
      }))

      const clusters: Cluster[] = clusterPoints(points, selectedDriverIds.length)

      // Сопоставляем кластеры с водителями (по порядку выбора)
      const result: ClusterPreview[] = clusters.map((cluster, i) => ({
        driverId: selectedDriverIds[i]!,
        driverName: drivers.find((d) => d.id === selectedDriverIds[i])?.name ?? '?',
        stopIds: cluster.points.map((p) => p.id),
        stopCount: cluster.points.length,
        totalArea: Math.round(cluster.totalWeight * 100) / 100,
        colorIndex: i % CLUSTER_COLORS.length,
      }))

      setPreview(result)
      setLoading(false)
    }, 10)
  }, [selectedDriverIds, geoStops, drivers])

  const handleApply = useCallback(() => {
    if (!preview) return

    for (const cluster of preview) {
      if (cluster.stopIds.length > 0) {
        assignDriverBulk(selectedDay, cluster.stopIds, cluster.driverId)
      }
    }

    const names = preview.map((c) => c.driverName).join(', ')
    toast.success(`Маршрут распределён: ${names}`, {
      action: {
        label: 'Отменить',
        onClick: () => {
          useRouteStore.temporal.getState().undo()
          toast.info('Распределение отменено')
        },
      },
    })

    setOpen(false)
    reset()
  }, [preview, assignDriverBulk, selectedDay])

  function reset() {
    setSelectedDriverIds([])
    setPreview(null)
    setLoading(false)
  }

  const canDistribute = selectedDriverIds.length >= 2 && geoStops.length >= selectedDriverIds.length

  // Не показываем кнопку если менее 2 водителей или нет точек
  if (availableDrivers.length < 2 || geoStops.length < 2) return null

  const noGeoStops = geoStops.length === 0

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <Split className="size-4" />
        Распределить
      </Button>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Распределить между водителями</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Шаг 1: выбор водителей */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Выберите водителей ({selectedDriverIds.length} из {availableDrivers.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {availableDrivers.map((driver) => {
                const isSelected = selectedDriverIds.includes(driver.id)
                const colorIdx = selectedDriverIds.indexOf(driver.id)
                const color = colorIdx >= 0 ? CLUSTER_COLORS[colorIdx % CLUSTER_COLORS.length] : null
                return (
                  <button
                    key={driver.id}
                    type="button"
                    onClick={() => toggleDriver(driver.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                      isSelected && color
                        ? `${color.border} ${color.bg} ${color.text}`
                        : 'border-border text-foreground hover:border-ring',
                    )}
                  >
                    {isSelected && color && (
                      <span className={cn('size-2 rounded-full', color.dot)} />
                    )}
                    {driver.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Информация о точках */}
          <p className="text-sm text-muted-foreground">
            {geoStops.length} точек с координатами будут распределены
          </p>

          {/* Кнопка расчёта */}
          {!preview && !loading && (
            <Button
              onClick={handleDistribute}
              disabled={!canDistribute}
              className="w-full"
            >
              {noGeoStops
                ? 'Нет точек с координатами'
                : !canDistribute
                  ? 'Выберите минимум 2 водителей'
                  : 'Рассчитать распределение'}
            </Button>
          )}

          {/* Загрузка */}
          {loading && (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Кластеризация точек...</p>
            </div>
          )}

          {/* Предпросмотр результата */}
          {preview && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Результат</p>
              {preview.map((cluster) => {
                const color = CLUSTER_COLORS[cluster.colorIndex]!
                return (
                  <div
                    key={cluster.driverId}
                    className={cn(
                      'rounded-lg border p-3',
                      color.border,
                      color.bg,
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn('size-2.5 rounded-full', color.dot)} />
                        <span className={cn('text-sm font-medium', color.text)}>
                          {cluster.driverName}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {cluster.stopCount} точек
                      </span>
                      <span className="flex items-center gap-1">
                        <Ruler className="size-3" />
                        {cluster.totalArea} м²
                      </span>
                    </div>
                  </div>
                )
              })}

              {/* Кнопка пересчёта */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDistribute}
                className="w-full text-muted-foreground"
              >
                Пересчитать
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); reset() }}>
            Отмена
          </Button>
          <Button onClick={handleApply} disabled={!preview}>
            <Users className="mr-1.5 size-4" />
            Применить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
