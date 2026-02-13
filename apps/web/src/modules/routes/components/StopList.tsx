import { useMemo, useCallback } from 'react'
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
import { useRouteStore } from '../store'
import { useClientStore } from '@/modules/clients'
import type { Client } from '@/modules/clients'
import { StopCard } from './StopCard'

interface StopListProps {
  searchQuery?: string
}

export function StopList({ searchQuery = '' }: StopListProps) {
  const routes = useRouteStore((s) => s.routes)
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const reorderStop = useRouteStore((s) => s.reorderStop)
  const clients = useClientStore((s) => s.clients)

  const clientMap = useMemo(() => {
    const map = new Map<string, Client>()
    for (const c of clients) {
      map.set(c.id, c)
    }
    return map
  }, [clients])

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

  const activeStops = dayRoute
    ? dayRoute.stops.filter((stop) => {
        const client = clientMap.get(stop.clientId)
        return client?.isActive !== false
      })
    : []

  if (!dayRoute || activeStops.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        Нет точек на этот день
      </div>
    )
  }

  const stops = activeStops
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

  if (stops.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        Ничего не найдено
      </div>
    )
  }

  const stopIds = stops.map(({ stop }) => stop.id)

  return (
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
                isCompleted={stop.isCompleted}
                stopIndex={stopIndex}
                isFirst={activeIndex === 0}
                isLast={activeIndex === activeStops.length - 1}
                isDndEnabled={!isSearching}
              />
            )
          })}
        </div>
      </SortableContext>
    </DndContext>
  )
}
