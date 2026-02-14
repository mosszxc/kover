import { useMemo } from 'react'
import { useRouteStore } from '../store'
import { useClientStore, getClientReplacements } from '@/modules/clients'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'

export interface RouteSummary {
  stopCount: number
  totalMats: number
  matsBySize: Partial<Record<string, number>>
  totalArea: number
}

export function useRouteSummary(): RouteSummary {
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const routes = useRouteStore((s) => s.routes)
  const clients = useClientStore((s) => s.clients)
  const sizes = useMatSizeStore((s) => s.sizes)

  return useMemo(() => {
    const dayRoute = routes.find((r) => r.day === selectedDay)
    if (!dayRoute) {
      return { stopCount: 0, totalMats: 0, matsBySize: {}, totalArea: 0 }
    }

    const clientMap = new Map(clients.map((c) => [c.id, c]))
    const areaMap = Object.fromEntries(sizes.map((s) => [s.id, s.area]))

    const matsBySize: Partial<Record<string, number>> = {}
    let totalArea = 0
    let totalMats = 0
    let activeStopCount = 0

    for (const stop of dayRoute.stops) {
      const client = clientMap.get(stop.clientId)
      if (!client || !client.isActive) continue

      activeStopCount++
      const replacements = getClientReplacements(client, selectedDay)
      for (const mat of client.mats) {
        const qty = mat.quantity * replacements
        matsBySize[mat.size] = (matsBySize[mat.size] ?? 0) + qty
        totalMats += qty
        totalArea += qty * (areaMap[mat.size] ?? 0)
      }
    }

    return {
      stopCount: activeStopCount,
      totalMats,
      matsBySize,
      totalArea: Math.round(totalArea * 100) / 100,
    }
  }, [selectedDay, routes, clients, sizes])
}
