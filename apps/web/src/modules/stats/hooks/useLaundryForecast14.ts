import { useMemo } from 'react'
import { useRouteStore } from '@/modules/routes'
import { useClientStore, getClientReplacements } from '@/modules/clients'
import type { Client } from '@/modules/clients'
import type { DayOfWeek } from '@/shared/types'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'

export type LoadLevel = 'normal' | 'elevated' | 'peak'

export interface DayForecast14 {
  date: string
  dayOfWeek: DayOfWeek
  totalArea: number
  stopCount: number
  matsBySize: Partial<Record<string, number>>
  returningFromPause: string[] // client names returning from pause on this day
  loadLevel: LoadLevel
}

export interface LaundryForecast14Data {
  days: DayForecast14[]
  avgArea: number
}

/** Check if client is paused on a specific future date (not just today) */
function isClientPausedOnDate(client: Client, date: string): boolean {
  if (!client.isActive) return true
  if (client.pausedUntil) {
    return client.pausedUntil > date
  }
  return false
}

/** Check if client returns from pause exactly on this date */
function isReturningFromPause(client: Client, date: string): boolean {
  if (!client.pausedUntil || !client.isActive) return false
  return client.pausedUntil === date
}

/** Check if stop is skipped on a specific future date */
function isStopSkippedOnDate(stop: { skippedUntil?: string }, date: string): boolean {
  if (!stop.skippedUntil) return false
  return stop.skippedUntil > date
}

function getLoadLevel(area: number, avgArea: number): LoadLevel {
  if (avgArea === 0) return 'normal'
  if (area <= avgArea * 1.1) return 'normal'
  if (area <= avgArea * 1.3) return 'elevated'
  return 'peak'
}

export function useLaundryForecast14(): LaundryForecast14Data {
  const routes = useRouteStore((s) => s.routes)
  const clients = useClientStore((s) => s.clients)
  const sizes = useMatSizeStore((s) => s.sizes)

  return useMemo(() => {
    const clientMap = new Map(clients.map((c) => [c.id, c]))
    const areaMap = Object.fromEntries(sizes.map((s) => [s.id, s.area]))

    // Build route map by day of week
    const routeByDay = new Map(routes.map((r) => [r.day, r]))

    // Generate 14 days starting from today
    const today = new Date()
    const forecastDays: Omit<DayForecast14, 'loadLevel'>[] = []

    for (let i = 0; i < 14; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const dateStr = d.toISOString().slice(0, 10)

      // JS: 0=Sun, 1=Mon ... 6=Sat → our DayOfWeek: 0=Mon ... 6=Sun
      const jsDay = d.getDay()
      const dayOfWeek = (jsDay === 0 ? 6 : jsDay - 1) as DayOfWeek

      const route = routeByDay.get(dayOfWeek)
      if (!route) {
        forecastDays.push({
          date: dateStr,
          dayOfWeek,
          totalArea: 0,
          stopCount: 0,
          matsBySize: {},
          returningFromPause: [],
        })
        continue
      }

      const matsBySize: Partial<Record<string, number>> = {}
      let totalArea = 0
      let stopCount = 0
      const returningFromPause: string[] = []

      for (const stop of route.stops) {
        const client = clientMap.get(stop.clientId)
        if (!client) continue

        // Check if client returns from pause on this date
        if (isReturningFromPause(client, dateStr)) {
          returningFromPause.push(client.name)
        }

        // Skip inactive/paused/skipped
        if (isClientPausedOnDate(client, dateStr)) continue
        if (isStopSkippedOnDate(stop, dateStr)) continue

        stopCount++
        const replacements = getClientReplacements(client, dayOfWeek)
        for (const mat of client.mats) {
          const qty = mat.quantity * replacements
          matsBySize[mat.size] = (matsBySize[mat.size] ?? 0) + qty
          totalArea += qty * (areaMap[mat.size] ?? 0)
        }
      }

      forecastDays.push({
        date: dateStr,
        dayOfWeek,
        totalArea: Math.round(totalArea * 100) / 100,
        stopCount,
        matsBySize,
        returningFromPause,
      })
    }

    // Calculate average area (only days with stops)
    const daysWithStops = forecastDays.filter((d) => d.stopCount > 0)
    const avgArea =
      daysWithStops.length > 0
        ? daysWithStops.reduce((sum, d) => sum + d.totalArea, 0) / daysWithStops.length
        : 0

    const days: DayForecast14[] = forecastDays.map((d) => ({
      ...d,
      loadLevel: getLoadLevel(d.totalArea, avgArea),
    }))

    return { days, avgArea: Math.round(avgArea * 100) / 100 }
  }, [routes, clients, sizes])
}
