import { create } from 'zustand'
import { temporal } from 'zundo'
import type { DayOfWeek } from '@/shared/types'
import type { DayRoute, RouteStop } from './types'
import { syncRouteChanges } from '@/shared/lib/sync/routeSync'

function getNextMonday(): string {
  const now = new Date()
  const day = now.getDay()
  // JS: 0=Sun,1=Mon...6=Sat → days until next Mon
  const daysUntil = day === 0 ? 1 : 8 - day
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntil)
  return next.toISOString().slice(0, 10)
}

interface RouteState {
  routes: DayRoute[]
  selectedDay: DayOfWeek
  selectDay: (day: DayOfWeek) => void
  addStop: (day: DayOfWeek, stop: RouteStop) => void
  removeStop: (day: DayOfWeek, stopId: string) => void
  removeClientFromAllRoutes: (clientId: string) => void
  skipStop: (day: DayOfWeek, stopId: string) => void
  unskipStop: (day: DayOfWeek, stopId: string) => void
  moveStop: (day: DayOfWeek, stopId: string, newPosition: number) => void
  reorderStop: (day: DayOfWeek, from: number, to: number) => void
  reorderAllStops: (day: DayOfWeek, stopIds: string[]) => void
  transferStop: (fromDay: DayOfWeek, toDay: DayOfWeek, stopId: string, toPosition?: number) => void
  toggleStopCompleted: (day: DayOfWeek, stopId: string) => void
  assignDriver: (day: DayOfWeek, stopId: string, driverId: string | null) => void
  assignDriverBulk: (day: DayOfWeek, stopIds: string[], driverId: string | null) => void
  seedRoutes: (routes: DayRoute[]) => void
}

const initialRoutes: DayRoute[] = [
  { day: 0, stops: [] },
  { day: 1, stops: [] },
  { day: 2, stops: [] },
  { day: 3, stops: [] },
  { day: 4, stops: [] },
  { day: 5, stops: [] },
  { day: 6, stops: [] },
]

export const useRouteStore = create<RouteState>()(
  temporal(
  (set) => ({
    routes: initialRoutes,
    selectedDay: 0 as DayOfWeek,

      selectDay: (day) => set({ selectedDay: day }),

      addStop: (day, stop) =>
        set((state) => ({
          routes: state.routes.map((route) => {
            if (route.day !== day) return route
            return { ...route, stops: [...route.stops, stop] }
          }),
        })),

      removeStop: (day, stopId) =>
        set((state) => ({
          routes: state.routes.map((route) => {
            if (route.day !== day) return route
            return {
              ...route,
              stops: route.stops
                .filter((s) => s.id !== stopId)
                .map((s, i) => ({ ...s, position: i })),
            }
          }),
        })),

      removeClientFromAllRoutes: (clientId) =>
        set((state) => ({
          routes: state.routes.map((route) => {
            const filtered = route.stops.filter((s) => s.clientId !== clientId)
            if (filtered.length === route.stops.length) return route
            return {
              ...route,
              stops: filtered.map((s, i) => ({ ...s, position: i })),
            }
          }),
        })),

      skipStop: (day, stopId) =>
        set((state) => ({
          routes: state.routes.map((route) => {
            if (route.day !== day) return route
            return {
              ...route,
              stops: route.stops.map((s) =>
                s.id === stopId ? { ...s, skippedUntil: getNextMonday() } : s,
              ),
            }
          }),
        })),

      unskipStop: (day, stopId) =>
        set((state) => ({
          routes: state.routes.map((route) => {
            if (route.day !== day) return route
            return {
              ...route,
              stops: route.stops.map((s) =>
                s.id === stopId ? { ...s, skippedUntil: undefined } : s,
              ),
            }
          }),
        })),

      moveStop: (day, stopId, newPosition) =>
        set((state) => ({
          routes: state.routes.map((route) => {
            if (route.day !== day) return route
            const stopIndex = route.stops.findIndex((s) => s.id === stopId)
            if (stopIndex === -1) return route
            const stops = [...route.stops]
            const moved = stops.splice(stopIndex, 1)[0]
            if (!moved) return route
            stops.splice(newPosition, 0, moved)
            return {
              ...route,
              stops: stops.map((s, i) => ({ ...s, position: i })),
            }
          }),
        })),

      reorderStop: (day, from, to) =>
        set((state) => ({
          routes: state.routes.map((route) => {
            if (route.day !== day) return route
            if (from < 0 || from >= route.stops.length) return route
            const stops = [...route.stops]
            const moved = stops.splice(from, 1)[0]
            if (!moved) return route
            stops.splice(to, 0, moved)
            return {
              ...route,
              stops: stops.map((s, i) => ({ ...s, position: i })),
            }
          }),
        })),

      reorderAllStops: (day, stopIds) =>
        set((state) => ({
          routes: state.routes.map((route) => {
            if (route.day !== day) return route
            const stopMap = new Map(route.stops.map((s) => [s.id, s]))
            const reordered: RouteStop[] = []
            for (const id of stopIds) {
              const stop = stopMap.get(id)
              if (stop) {
                reordered.push({ ...stop, position: reordered.length })
                stopMap.delete(id)
              }
            }
            // Append any stops not in stopIds (without coords) at the end
            for (const stop of stopMap.values()) {
              reordered.push({ ...stop, position: reordered.length })
            }
            return { ...route, stops: reordered }
          }),
        })),

      transferStop: (fromDay, toDay, stopId, toPosition) =>
        set((state) => {
          const fromRoute = state.routes.find((r) => r.day === fromDay)
          if (!fromRoute) return state
          const stop = fromRoute.stops.find((s) => s.id === stopId)
          if (!stop) return state

          return {
            routes: state.routes.map((route) => {
              if (route.day === fromDay) {
                return {
                  ...route,
                  stops: route.stops
                    .filter((s) => s.id !== stopId)
                    .map((s, i) => ({ ...s, position: i })),
                }
              }
              if (route.day === toDay) {
                const newStop = { ...stop, isCompleted: false }
                const stops = [...route.stops]
                const insertAt = toPosition !== undefined ? toPosition : stops.length
                stops.splice(insertAt, 0, newStop)
                return {
                  ...route,
                  stops: stops.map((s, i) => ({ ...s, position: i })),
                }
              }
              return route
            }),
          }
        }),

      toggleStopCompleted: (day, stopId) =>
        set((state) => ({
          routes: state.routes.map((route) => {
            if (route.day !== day) return route
            return {
              ...route,
              stops: route.stops.map((s) =>
                s.id === stopId
                  ? { ...s, isCompleted: !s.isCompleted }
                  : s,
              ),
            }
          }),
        })),

      assignDriver: (day, stopId, driverId) =>
        set((state) => ({
          routes: state.routes.map((route) => {
            if (route.day !== day) return route
            return {
              ...route,
              stops: route.stops.map((s) =>
                s.id === stopId
                  ? { ...s, driverId: driverId ?? undefined }
                  : s,
              ),
            }
          }),
        })),

      assignDriverBulk: (day, stopIds, driverId) =>
        set((state) => {
          const idSet = new Set(stopIds)
          return {
            routes: state.routes.map((route) => {
              if (route.day !== day) return route
              return {
                ...route,
                stops: route.stops.map((s) =>
                  idSet.has(s.id)
                    ? { ...s, driverId: driverId ?? undefined }
                    : s,
                ),
              }
            }),
          }
        }),

      seedRoutes: (routes) => {
        // Ensure all 7 days exist (seed data may only have Mon-Fri)
        const existingDays = new Set(routes.map((r) => r.day))
        const complete = [...routes]
        for (const day of [0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]) {
          if (!existingDays.has(day)) {
            complete.push({ day, stops: [] })
          }
        }
        set({ routes: complete })
      },
    }),
    {
      limit: 20,
      partialize: (state) => {
        const { routes } = state
        return { routes } as RouteState
      },
    },
  ),
)

// Write-through sync для routes → Supabase (day_routes + route_stops)
useRouteStore.subscribe((state, prevState) => {
  if (state.routes !== prevState.routes) {
    syncRouteChanges(prevState.routes, state.routes)
  }
})
