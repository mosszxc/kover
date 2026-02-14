import { supabase } from '@/shared/lib/supabase'
import { routeStopToRemote } from './adapters'
import type { DayRoute } from '@/modules/routes/types'

let dayRouteIdCache: Map<number, string> | null = null

async function getDayRouteIds(): Promise<Map<number, string>> {
  if (dayRouteIdCache) return dayRouteIdCache

  if (!supabase) return new Map()

  const { data } = await supabase.from('day_routes').select('id, day')

  if (data) {
    dayRouteIdCache = new Map(data.map((dr) => [dr.day, dr.id]))
  }

  return dayRouteIdCache ?? new Map()
}

/**
 * Write-through sync для routes.
 * Вызывается после каждого изменения в route store.
 * Сравнивает prev и next, и upsert/delete только изменённые stops.
 */
export async function syncRouteChanges(
  prevRoutes: DayRoute[],
  nextRoutes: DayRoute[],
) {
  if (!supabase) return

  const dayRouteIds = await getDayRouteIds()
  if (dayRouteIds.size === 0) return

  for (const nextRoute of nextRoutes) {
    const prevRoute = prevRoutes.find((r) => r.day === nextRoute.day)
    if (!prevRoute || prevRoute.stops === nextRoute.stops) continue

    const dayRouteId = dayRouteIds.get(nextRoute.day)
    if (!dayRouteId) continue

    const prevIds = new Set(prevRoute.stops.map((s) => s.id))
    const nextIds = new Set(nextRoute.stops.map((s) => s.id))

    // Upsert changed/new stops
    const toUpsert = nextRoute.stops.filter((stop) => {
      if (!prevIds.has(stop.id)) return true
      const prev = prevRoute.stops.find((s) => s.id === stop.id)
      return prev !== stop
    })

    if (toUpsert.length > 0) {
      const remoteStops = toUpsert.map((s) => routeStopToRemote(s, dayRouteId))
      supabase
        .from('route_stops')
        .upsert(remoteStops)
        .then(({ error }) => {
          if (error) console.error('[sync] route_stops upsert:', error.message)
        })
    }

    // Delete removed stops
    for (const id of prevIds) {
      if (!nextIds.has(id)) {
        supabase
          .from('route_stops')
          .delete()
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.error('[sync] route_stops delete:', error.message)
          })
      }
    }
  }
}

export function invalidateDayRouteCache() {
  dayRouteIdCache = null
}
