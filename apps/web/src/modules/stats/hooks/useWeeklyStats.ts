import { useMemo } from 'react'
import { useRouteStore, isStopSkipped } from '@/modules/routes'
import { useClientStore, getClientReplacements } from '@/modules/clients'
import type { DayOfWeek } from '@/shared/types'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import { useVisibleDays } from '@/shared/hooks/useVisibleDays'

export interface DayStat {
  day: DayOfWeek
  stopCount: number
  matsBySize: Partial<Record<string, number>>
  totalArea: number
  totalCost: number
}

export interface WeeklyStats {
  days: DayStat[]
  totals: {
    stopCount: number
    matsBySize: Partial<Record<string, number>>
    totalArea: number
    totalCost: number
  }
  hasPrices: boolean
}

export function useWeeklyStats(): WeeklyStats {
  const routes = useRouteStore((s) => s.routes)
  const clients = useClientStore((s) => s.clients)
  const sizes = useMatSizeStore((s) => s.sizes)
  const visibleDays = useVisibleDays()

  return useMemo(() => {
    const clientMap = new Map(clients.map((c) => [c.id, c]))
    const areaMap = Object.fromEntries(sizes.map((s) => [s.id, s.area]))
    const priceMap = Object.fromEntries(sizes.map((s) => [s.id, s.rentalPrice]))
    const visibleSet = new Set(visibleDays)
    const hasPrices = sizes.some((s) => s.rentalPrice > 0)

    const days: DayStat[] = routes.filter((r) => visibleSet.has(r.day)).map((route) => {
      const matsBySize: Partial<Record<string, number>> = {}
      let totalArea = 0
      let totalCost = 0
      let stopCount = 0

      for (const stop of route.stops) {
        const client = clientMap.get(stop.clientId)
        if (!client || !client.isActive || isStopSkipped(stop)) continue

        stopCount++
        const replacements = getClientReplacements(client, route.day)
        for (const mat of client.mats) {
          const qty = mat.quantity * replacements
          matsBySize[mat.size] = (matsBySize[mat.size] ?? 0) + qty
          totalArea += qty * (areaMap[mat.size] ?? 0)
          totalCost += qty * (priceMap[mat.size] ?? 0)
        }
      }

      return {
        day: route.day,
        stopCount,
        matsBySize,
        totalArea: Math.round(totalArea * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
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
      totalCost: Math.round(days.reduce((s, d) => s + d.totalCost, 0) * 100) / 100,
    }

    return { days, totals, hasPrices }
  }, [routes, clients, sizes, visibleDays])
}
