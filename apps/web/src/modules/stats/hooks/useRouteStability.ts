import { useMemo } from 'react'
import { useServiceLogStore } from '@/shared/stores/serviceLogStore'
import { useRouteStore } from '@/modules/routes'
import type { DayOfWeek } from '@/shared/types'

export type StabilityLevel = 'stable' | 'moderate' | 'unstable'

export interface DayStability {
  day: DayOfWeek
  totalStops: number
  changedClients: number
  stabilityPct: number
  level: StabilityLevel
}

export interface RouteStabilityData {
  days: DayStability[]
  overallPct: number
  overallLevel: StabilityLevel
}

const CHANGE_EVENT_TYPES = new Set(['removed', 'transferred', 'schedule_changed'])

function getLevel(pct: number): StabilityLevel {
  if (pct >= 85) return 'stable'
  if (pct >= 60) return 'moderate'
  return 'unstable'
}

export function useRouteStability(weeksBack = 4): RouteStabilityData {
  const entries = useServiceLogStore((s) => s.entries)
  const routes = useRouteStore((s) => s.routes)

  return useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - weeksBack * 7)
    const cutoffStr = cutoff.toISOString()

    // Count unique changed clientIds per day
    const changedByDay = new Map<DayOfWeek, Set<string>>()
    for (let d = 0; d <= 6; d++) {
      changedByDay.set(d as DayOfWeek, new Set())
    }

    for (const entry of entries) {
      if (entry.timestamp < cutoffStr) continue
      if (!CHANGE_EVENT_TYPES.has(entry.type)) continue
      if (entry.day != null) {
        changedByDay.get(entry.day)?.add(entry.clientId)
      }
      // For transfers, also count the target day
      if (entry.type === 'transferred' && entry.targetDay != null) {
        changedByDay.get(entry.targetDay)?.add(entry.clientId)
      }
    }

    const days: DayStability[] = routes.map((route) => {
      const totalStops = route.stops.length
      const changed = changedByDay.get(route.day)?.size ?? 0
      const changedClamped = Math.min(changed, totalStops)
      const stabilityPct = totalStops === 0 ? 100 : Math.round(((totalStops - changedClamped) / totalStops) * 100)
      return {
        day: route.day,
        totalStops,
        changedClients: changed,
        stabilityPct,
        level: getLevel(stabilityPct),
      }
    })

    // Overall: weighted average by stop count
    const totalAllStops = days.reduce((sum, d) => sum + d.totalStops, 0)
    const overallPct = totalAllStops === 0
      ? 100
      : Math.round(days.reduce((sum, d) => sum + d.stabilityPct * d.totalStops, 0) / totalAllStops)

    return {
      days,
      overallPct,
      overallLevel: getLevel(overallPct),
    }
  }, [entries, routes, weeksBack])
}
