import { useMemo, useCallback, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { ChevronDown, ChevronRight, Undo2, CalendarOff, CalendarPlus, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useRouteStore } from '../store'
import { useClientStore } from '@/modules/clients'
import type { Client } from '@/modules/clients'
import { useGeoAnomalies } from '../hooks/useGeoAnomalies'
import { isStopSkipped } from '../utils'
import { useRouteExceptionsStore } from '@/shared/stores/routeExceptionsStore'
import { StopCard, type DriverOption, type StopPaymentInfo } from './StopCard'

interface StopListProps {
  searchQuery?: string
  drivers?: DriverOption[]
  driverFilter?: string | 'unassigned' | null
  onEditClient?: (client: Client) => void
  paymentStatusMap?: Map<string, StopPaymentInfo>
  onServiceReport?: (client: Client) => void
}

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDateRu(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export function StopList({ searchQuery = '', drivers = [], driverFilter = null, onEditClient, paymentStatusMap, onServiceReport }: StopListProps) {
  const routes = useRouteStore((s) => s.routes)
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const reorderStop = useRouteStore((s) => s.reorderStop)
  const clients = useClientStore((s) => s.clients)
  const exceptions = useRouteExceptionsStore((s) => s.exceptions)
  const removeException = useRouteExceptionsStore((s) => s.removeException)

  const today = getTodayISO()

  const clientMap = useMemo(() => {
    const map = new Map<string, Client>()
    for (const c of clients) {
      map.set(c.id, c)
    }
    return map
  }, [clients])

  const todaySkipIds = useMemo(() => {
    const set = new Set<string>()
    for (const ex of exceptions) {
      if (ex.date === today && ex.day === selectedDay && ex.type === 'skip') {
        set.add(ex.clientId)
      }
    }
    return set
  }, [exceptions, today, selectedDay])

  const todayAdds = useMemo(
    () => exceptions.filter((ex) => ex.date === today && ex.day === selectedDay && ex.type === 'add'),
    [exceptions, today, selectedDay],
  )

  const todaySkipExceptions = useMemo(
    () => exceptions.filter((ex) => ex.date === today && ex.day === selectedDay && ex.type === 'skip'),
    [exceptions, today, selectedDay],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const dayRoute = routes.find((r) => r.day === selectedDay)
  const query = searchQuery.toLowerCase()
  const isSearching = query.length > 0

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id || !dayRoute) return

      const from = dayRoute.stops.findIndex((s) => s.id === active.id)
      const to = dayRoute.stops.findIndex((s) => s.id === over.id)
      if (from !== -1 && to !== -1) {
        reorderStop(selectedDay, from, to)
      }
    },
    [dayRoute, selectedDay, reorderStop],
  )

  const unskipStop = useRouteStore((s) => s.unskipStop)
  const [showSkipped, setShowSkipped] = useState(false)

  const { activeStops, skippedStops } = useMemo(() => {
    if (!dayRoute) return { activeStops: [], skippedStops: [] }
    const active: typeof dayRoute.stops = []
    const skipped: typeof dayRoute.stops = []
    for (const stop of dayRoute.stops) {
      const client = clientMap.get(stop.clientId)
      if (client?.isActive === false) continue
      if (todaySkipIds.has(stop.clientId)) {
        skipped.push(stop)
      } else if (isStopSkipped(stop)) {
        skipped.push(stop)
      } else {
        active.push(stop)
      }
    }
    return { activeStops: active, skippedStops: skipped }
  }, [dayRoute, clientMap, todaySkipIds])

  const activeClients = useMemo(
    () => activeStops.map((s) => clientMap.get(s.clientId)).filter(Boolean) as Client[],
    [activeStops, clientMap],
  )
  const anomalies = useGeoAnomalies(activeClients)

  if (!dayRoute || (activeStops.length === 0 && skippedStops.length === 0)) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Нет точек на этот день
      </div>
    )
  }

  const filteredByDriver = driverFilter
    ? activeStops.filter((stop) =>
        driverFilter === 'unassigned' ? !stop.driverId : stop.driverId === driverFilter,
      )
    : activeStops

  const stops = filteredByDriver
    .map((stop, index) => {
      const client = clientMap.get(stop.clientId)
      return { stop, client, number: index + 1 }
    })
    .filter(({ client }) => {
      if (!query || !client) return true
      return (
        client.originalName.toLowerCase().includes(query) ||
        client.address.toLowerCase().includes(query)
      )
    })

  if (stops.length === 0 && skippedStops.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Ничего не найдено
      </div>
    )
  }

  const stopIds = stops.map(({ stop }) => stop.id)

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={stopIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-px">
            {stops.map(({ stop, client, number }) => {
              if (!client) return null
              const stopIndex = dayRoute.stops.indexOf(stop)
              const activeIndex = activeStops.indexOf(stop)
              return (
                <StopCard
                  key={stop.id}
                  number={number}
                  client={client}
                  stopId={stop.id}
                  driverId={stop.driverId}
                  drivers={drivers}
                  stopIndex={stopIndex}
                  isFirst={activeIndex === 0}
                  isLast={activeIndex === activeStops.length - 1}
                  isDndEnabled={!isSearching}
                  isAnomaly={anomalies.has(client.id)}
                  isMissingCoords={client.lat == null || client.lng == null}
                  onEditClient={onEditClient}
                  paymentInfo={paymentStatusMap?.get(client.id)}
                  onServiceReport={onServiceReport}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>

      {todayAdds.length > 0 && (
        <div className="mt-4 print:hidden">
          <p className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground">
            <CalendarPlus className="size-4 text-green-400" />
            Разовые визиты на сегодня
          </p>
          <div className="mt-1 space-y-px">
            {todayAdds.map((ex) => {
              const client = clientMap.get(ex.clientId)
              if (!client) return null
              return (
                <div
                  key={ex.id}
                  className="flex items-center gap-3 border-l-3 border-l-green-500 p-3"
                >
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {client.originalName}
                    {ex.reason && <span className="ml-2 text-sm text-muted-foreground">({ex.reason})</span>}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 gap-1 text-sm text-red-400 hover:text-red-300"
                    onClick={() => removeException(ex.id)}
                  >
                    <X className="size-3" />
                    Отменить
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {skippedStops.length > 0 && (
        <div className="mt-4 print:hidden">
          <button
            type="button"
            onClick={() => setShowSkipped((v) => !v)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent"
          >
            {showSkipped ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            Пропущены ({skippedStops.length})
          </button>
          {showSkipped && (
            <div className="mt-1 space-y-px">
              {skippedStops.map((stop) => {
                const client = clientMap.get(stop.clientId)
                if (!client) return null
                const dateException = todaySkipExceptions.find((ex) => ex.clientId === stop.clientId)
                return (
                  <div
                    key={stop.id}
                    className="flex items-center gap-3 border-l-3 border-l-border p-3"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                      {client.originalName}
                      {dateException && (
                        <span className="ml-2 inline-flex items-center gap-1 text-sm no-underline">
                          <CalendarOff className="inline size-3" />
                          {formatDateRu(dateException.date)}
                          {dateException.reason && ` — ${dateException.reason}`}
                        </span>
                      )}
                    </span>
                    {dateException ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 gap-1 text-sm"
                        onClick={() => removeException(dateException.id)}
                      >
                        <Undo2 className="size-3" />
                        Отменить
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 gap-1 text-sm"
                        onClick={() => unskipStop(selectedDay, stop.id)}
                      >
                        <Undo2 className="size-3" />
                        Вернуть
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </>
  )
}
