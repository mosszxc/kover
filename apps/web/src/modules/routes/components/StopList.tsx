import { useMemo } from 'react'
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
  const clients = useClientStore((s) => s.clients)

  const clientMap = useMemo(() => {
    const map = new Map<string, Client>()
    for (const c of clients) {
      map.set(c.id, c)
    }
    return map
  }, [clients])

  const dayRoute = routes.find((r) => r.day === selectedDay)
  const query = searchQuery.toLowerCase()

  if (!dayRoute || dayRoute.stops.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        Нет точек на этот день
      </div>
    )
  }

  const stops = dayRoute.stops
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

  return (
    <div className="space-y-px">
      {stops.map(({ stop, client, number }) => {
        if (!client) return null
        return (
          <StopCard
            key={stop.id}
            number={number}
            client={client}
            stopId={stop.id}
            isCompleted={stop.isCompleted}
          />
        )
      })}
    </div>
  )
}
