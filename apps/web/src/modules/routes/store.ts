import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DayOfWeek } from '@/shared/types'
import type { DayRoute, RouteStop } from './types'

interface RouteState {
  routes: DayRoute[]
  selectedDay: DayOfWeek
  selectDay: (day: DayOfWeek) => void
  addStop: (day: DayOfWeek, blockIndex: number, stop: RouteStop) => void
  removeStop: (day: DayOfWeek, stopId: string) => void
  moveStop: (day: DayOfWeek, stopId: string, newPosition: number) => void
  reorderStop: (day: DayOfWeek, from: number, to: number) => void
  toggleStopCompleted: (day: DayOfWeek, stopId: string) => void
  seedRoutes: (routes: DayRoute[]) => void
}

const initialRoutes: DayRoute[] = [
  { day: 0, blocks: [{ id: 'mon-1', stops: [] }] },
  { day: 1, blocks: [{ id: 'tue-1', stops: [] }] },
  { day: 2, blocks: [{ id: 'wed-1', stops: [] }] },
  { day: 3, blocks: [{ id: 'thu-1', stops: [] }] },
  { day: 4, blocks: [{ id: 'fri-1', stops: [] }] },
]

export const useRouteStore = create<RouteState>()(
  persist(
    (set) => ({
      routes: initialRoutes,
      selectedDay: 0 as DayOfWeek,

      selectDay: (day) => set({ selectedDay: day }),

      addStop: (day, blockIndex, stop) =>
        set((state) => ({
          routes: state.routes.map((route) => {
            if (route.day !== day) return route
            return {
              ...route,
              blocks: route.blocks.map((block, i) => {
                if (i !== blockIndex) return block
                return { ...block, stops: [...block.stops, stop] }
              }),
            }
          }),
        })),

      removeStop: (day, stopId) =>
        set((state) => ({
          routes: state.routes.map((route) => {
            if (route.day !== day) return route
            return {
              ...route,
              blocks: route.blocks.map((block) => ({
                ...block,
                stops: block.stops.filter((s) => s.id !== stopId),
              })),
            }
          }),
        })),

      moveStop: (day, stopId, newPosition) =>
        set((state) => ({
          routes: state.routes.map((route) => {
            if (route.day !== day) return route
            return {
              ...route,
              blocks: route.blocks.map((block) => {
                const stopIndex = block.stops.findIndex(
                  (s) => s.id === stopId,
                )
                if (stopIndex === -1) return block
                const stops = [...block.stops]
                const moved = stops.splice(stopIndex, 1)[0]
                if (!moved) return block
                stops.splice(newPosition, 0, moved)
                return {
                  ...block,
                  stops: stops.map((s, i) => ({ ...s, position: i })),
                }
              }),
            }
          }),
        })),

      reorderStop: (day, from, to) =>
        set((state) => ({
          routes: state.routes.map((route) => {
            if (route.day !== day) return route
            return {
              ...route,
              blocks: route.blocks.map((block) => {
                if (from < 0 || from >= block.stops.length) return block
                const stops = [...block.stops]
                const moved = stops.splice(from, 1)[0]
                if (!moved) return block
                stops.splice(to, 0, moved)
                return {
                  ...block,
                  stops: stops.map((s, i) => ({ ...s, position: i })),
                }
              }),
            }
          }),
        })),

      toggleStopCompleted: (day, stopId) =>
        set((state) => ({
          routes: state.routes.map((route) => {
            if (route.day !== day) return route
            return {
              ...route,
              blocks: route.blocks.map((block) => ({
                ...block,
                stops: block.stops.map((s) =>
                  s.id === stopId
                    ? { ...s, isCompleted: !s.isCompleted }
                    : s,
                ),
              })),
            }
          }),
        })),

      seedRoutes: (routes) => set({ routes }),
    }),
    { name: 'kover-routes', version: 1 },
  ),
)
