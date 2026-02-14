import { useMemo } from 'react'
import { useRouteStore, isStopSkipped } from '@/modules/routes'
import { useClientStore } from '@/modules/clients'
import { detectGeoAnomalies } from '@/shared/lib/geoAnomalies'

export interface MapStop {
  position: number
  clientName: string
  address: string
  lat: number
  lng: number
}

export function useMapData() {
  const routes = useRouteStore((s) => s.routes)
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const clients = useClientStore((s) => s.clients)

  return useMemo(() => {
    const clientMap = new Map(clients.map((c) => [c.id, c]))
    const dayRoute = routes.find((r) => r.day === selectedDay)

    if (!dayRoute) return []

    const activeGeoClients = dayRoute.stops
      .map((stop) => {
        const client = clientMap.get(stop.clientId)
        if (!client || !client.isActive || isStopSkipped(stop)) return null
        if (client.lat == null || client.lng == null) return null
        return client
      })
      .filter((c) => c != null)

    const anomalyIds = detectGeoAnomalies(activeGeoClients)

    const stops: MapStop[] = []
    for (const stop of dayRoute.stops) {
      const client = clientMap.get(stop.clientId)
      if (!client || !client.isActive || isStopSkipped(stop)) continue
      if (client.lat == null || client.lng == null) continue
      if (anomalyIds.has(client.id)) continue

      stops.push({
        position: stops.length + 1,
        clientName: client.name || client.originalName,
        address: client.address,
        lat: client.lat,
        lng: client.lng,
      })
    }

    return stops
  }, [routes, selectedDay, clients])
}
