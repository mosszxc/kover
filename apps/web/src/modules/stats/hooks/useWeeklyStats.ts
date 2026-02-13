import { useMemo } from 'react'
import { useRouteStore } from '@/modules/routes'
import { useClientStore } from '@/modules/clients'
import type { DayOfWeek } from '@/shared/types'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'

export interface DayStat {
  day: DayOfWeek
  stopCount: number
  matsBySize: Partial<Record<string, number>>
  totalArea: number
}

export interface WeeklyStats {
  days: DayStat[]
  totals: {
    stopCount: number
    matsBySize: Partial<Record<string, number>>
    totalArea: number
  }
}

export function useWeeklyStats(): WeeklyStats {
  const routes = useRouteStore((s) => s.routes)
  const clients = useClientStore((s) => s.clients)
  const sizes = useMatSizeStore((s) => s.sizes)

  return useMemo(() => {
    const clientMap = new Map(clients.map((c) => [c.id, c]))
    const areaMap = Object.fromEntries(sizes.map((s) => [s.id, s.area]))

    const days: DayStat[] = routes.map((route) => {
      const matsBySize: Partial<Record<string, number>> = {}
      let totalArea = 0
      let stopCount = 0

      for (const stop of route.stops) {
        const client = clientMap.get(stop.clientId)
        if (!client || !client.isActive) continue

        stopCount++
        for (const mat of client.mats) {
          matsBySize[mat.size] = (matsBySize[mat.size] ?? 0) + mat.quantity
          totalArea += mat.quantity * (areaMap[mat.size] ?? 0)
        }
      }

      return {
        day: route.day,
        stopCount,
        matsBySize,
        totalArea: Math.round(totalArea * 100) / 100,
      }
    })

    const totals = {
      stopCount: days.reduce((s, d) => s + d.stopCount, 0),
      matsBySize: days.reduce<Partial<Record<string, number>>>((acc, d) => {
        for (const [size, qty] of Object.entries(d.matsBySize)) {
          acc[size] = (acc[size] ?? 0) + (qty ?? 0)
        }
        return acc
      }, {}),
      totalArea: Math.round(days.reduce((s, d) => s + d.totalArea, 0) * 100) / 100,
    }

    return { days, totals }
  }, [routes, clients, sizes])
}
