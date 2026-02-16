import { useMemo } from 'react'
import type { DayOfWeek } from '@/shared/types'

interface RouteStopData {
  clientId: string
  skippedUntil?: string
}

interface DayRouteData {
  day: DayOfWeek
  stops: RouteStopData[]
}

interface ClientData {
  id: string
  isActive: boolean
  mats: { size: string; quantity: number }[]
}

export interface DayForecast {
  day: DayOfWeek
  demand: Map<string, number>
  totalDemand: number
}

export interface SizeForecast {
  sizeId: string
  inStock: number
  inLaundry: number
  weekDemand: number[]
  shortages: { day: DayOfWeek; shortage: number }[]
}

interface UseLaundryForecastParams {
  routes: DayRouteData[]
  clients: ClientData[]
  inventorySummary: { sizeId: string; inStock: number; inLaundry: number }[]
}

function isStopActive(stop: RouteStopData): boolean {
  if (!stop.skippedUntil) return true
  const today = new Date().toISOString().slice(0, 10)
  return stop.skippedUntil <= today
}

export function useLaundryForecast({ routes, clients, inventorySummary }: UseLaundryForecastParams): SizeForecast[] {
  const clientMap = useMemo(() => {
    const map = new Map<string, ClientData>()
    for (const c of clients) map.set(c.id, c)
    return map
  }, [clients])

  return useMemo(() => {
    // Calculate demand per day per size
    const dayDemand: Map<DayOfWeek, Map<string, number>> = new Map()

    for (const route of routes) {
      const sizeDemand = new Map<string, number>()
      for (const stop of route.stops) {
        if (!isStopActive(stop)) continue
        const client = clientMap.get(stop.clientId)
        if (!client || !client.isActive) continue
        for (const mat of client.mats) {
          sizeDemand.set(mat.size, (sizeDemand.get(mat.size) ?? 0) + mat.quantity)
        }
      }
      dayDemand.set(route.day, sizeDemand)
    }

    // Build per-size forecasts
    const allSizeIds = new Set<string>()
    for (const inv of inventorySummary) allSizeIds.add(inv.sizeId)
    for (const [, sizeDemand] of dayDemand) {
      for (const sizeId of sizeDemand.keys()) allSizeIds.add(sizeId)
    }

    return Array.from(allSizeIds).map((sizeId) => {
      const inv = inventorySummary.find((i) => i.sizeId === sizeId)
      const inStock = inv?.inStock ?? 0
      const inLaundry = inv?.inLaundry ?? 0

      const weekDemand: number[] = []
      const shortages: { day: DayOfWeek; shortage: number }[] = []

      for (let day = 0; day < 7; day++) {
        const demand = dayDemand.get(day as DayOfWeek)?.get(sizeId) ?? 0
        weekDemand.push(demand)
        if (demand > 0 && demand > inStock) {
          shortages.push({ day: day as DayOfWeek, shortage: demand - inStock })
        }
      }

      return { sizeId, inStock, inLaundry, weekDemand, shortages }
    })
  }, [routes, clientMap, inventorySummary])
}
