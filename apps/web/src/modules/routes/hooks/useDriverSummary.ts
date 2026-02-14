import { useMemo } from 'react'
import { useRouteStore } from '../store'
import { useClientStore } from '@/modules/clients'

export interface DriverSummaryItem {
  driverId: string | null
  stopCount: number
  matCount: number
}

export function useDriverSummary(): DriverSummaryItem[] {
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const routes = useRouteStore((s) => s.routes)
  const clients = useClientStore((s) => s.clients)

  return useMemo(() => {
    const dayRoute = routes.find((r) => r.day === selectedDay)
    if (!dayRoute) return []

    const clientMap = new Map(clients.map((c) => [c.id, c]))
    const map = new Map<string | null, { stopCount: number; matCount: number }>()

    for (const stop of dayRoute.stops) {
      const client = clientMap.get(stop.clientId)
      if (!client || !client.isActive) continue

      const key = stop.driverId ?? null
      const entry = map.get(key) ?? { stopCount: 0, matCount: 0 }
      entry.stopCount++
      entry.matCount += client.mats.reduce((sum, m) => sum + m.quantity, 0)
      map.set(key, entry)
    }

    const result: DriverSummaryItem[] = []
    for (const [driverId, data] of map) {
      result.push({ driverId, ...data })
    }

    // Unassigned first, then drivers
    result.sort((a, b) => {
      if (a.driverId === null) return -1
      if (b.driverId === null) return 1
      return 0
    })

    return result
  }, [selectedDay, routes, clients])
}
