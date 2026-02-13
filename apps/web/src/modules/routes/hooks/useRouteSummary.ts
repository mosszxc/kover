import { useMemo } from 'react'
import { useRouteStore } from '../store'
import { useClientStore } from '@/modules/clients'
import type { MatSize } from '@/shared/types'
import { MAT_AREA } from '@/shared/types'

export interface RouteSummary {
  stopCount: number
  matsBySize: Partial<Record<MatSize, number>>
  totalArea: number
}

export function useRouteSummary(): RouteSummary {
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const routes = useRouteStore((s) => s.routes)
  const clients = useClientStore((s) => s.clients)

  return useMemo(() => {
    const dayRoute = routes.find((r) => r.day === selectedDay)
    if (!dayRoute) {
      return { stopCount: 0, matsBySize: {}, totalArea: 0 }
    }

    const clientMap = new Map(clients.map((c) => [c.id, c]))

    const matsBySize: Partial<Record<MatSize, number>> = {}
    let totalArea = 0
    let activeStopCount = 0

    for (const stop of dayRoute.stops) {
      const client = clientMap.get(stop.clientId)
      if (!client || !client.isActive) continue

      activeStopCount++
      for (const mat of client.mats) {
        matsBySize[mat.size] = (matsBySize[mat.size] ?? 0) + mat.quantity
        totalArea += mat.quantity * (MAT_AREA[mat.size] ?? 0)
      }
    }

    return {
      stopCount: activeStopCount,
      matsBySize,
      totalArea: Math.round(totalArea * 100) / 100,
    }
  }, [selectedDay, routes, clients])
}
