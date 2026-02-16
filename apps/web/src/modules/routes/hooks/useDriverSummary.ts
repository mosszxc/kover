import { useMemo } from 'react'
import { useRouteStore } from '../store'
import { useClientStore, getClientReplacements } from '@/modules/clients'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import { isStopSkipped } from '../utils'

export interface DriverSummaryItem {
  driverId: string | null
  stopCount: number
  matCount: number
  totalArea: number
  totalCost: number
}

export function useDriverSummary(): DriverSummaryItem[] {
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const routes = useRouteStore((s) => s.routes)
  const clients = useClientStore((s) => s.clients)
  const sizes = useMatSizeStore((s) => s.sizes)

  return useMemo(() => {
    const dayRoute = routes.find((r) => r.day === selectedDay)
    if (!dayRoute) return []

    const clientMap = new Map(clients.map((c) => [c.id, c]))
    const priceMap = Object.fromEntries(sizes.map((s) => [s.id, s.rentalPrice]))
    const areaMap = Object.fromEntries(sizes.map((s) => [s.id, s.area]))
    const map = new Map<string | null, { stopCount: number; matCount: number; totalArea: number; totalCost: number }>()

    for (const stop of dayRoute.stops) {
      const client = clientMap.get(stop.clientId)
      if (!client || !client.isActive || isStopSkipped(stop)) continue

      const key = stop.driverId ?? null
      const entry = map.get(key) ?? { stopCount: 0, matCount: 0, totalArea: 0, totalCost: 0 }
      entry.stopCount++
      const replacements = getClientReplacements(client, selectedDay)
      for (const mat of client.mats) {
        const qty = mat.quantity * replacements
        entry.matCount += qty
        entry.totalArea += qty * (areaMap[mat.size] ?? 0)
        entry.totalCost += qty * (priceMap[mat.size] ?? 0)
      }
      map.set(key, entry)
    }

    const result: DriverSummaryItem[] = []
    for (const [driverId, data] of map) {
      result.push({
        driverId,
        ...data,
        totalArea: Math.round(data.totalArea * 100) / 100,
        totalCost: Math.round(data.totalCost * 100) / 100,
      })
    }

    // Unassigned first, then drivers
    result.sort((a, b) => {
      if (a.driverId === null) return -1
      if (b.driverId === null) return 1
      return 0
    })

    return result
  }, [selectedDay, routes, clients, sizes])
}
