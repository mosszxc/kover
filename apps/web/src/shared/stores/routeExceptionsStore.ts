import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DayOfWeek } from '@/shared/types'
import { generateId } from '@/shared/lib/generateId'

export interface RouteException {
  id: string
  clientId: string
  /** ISO date, e.g. '2026-02-18' */
  date: string
  /** skip = не приезжать; add = разовый визит */
  type: 'skip' | 'add'
  /** Day of week for 'add' exceptions (which day template to use) */
  day: DayOfWeek
  reason?: string
  createdAt: string
}

interface RouteExceptionsState {
  exceptions: RouteException[]
  addException: (exception: Omit<RouteException, 'id' | 'createdAt'>) => void
  removeException: (id: string) => void
  /** Get exceptions for a specific date */
  getExceptionsForDate: (date: string) => RouteException[]
  /** Get skip exceptions for a specific date and day */
  getSkipsForDate: (date: string, day: DayOfWeek) => RouteException[]
  /** Get add exceptions for a specific date and day */
  getAddsForDate: (date: string, day: DayOfWeek) => RouteException[]
}

function pruneExpiredExceptions(exceptions: RouteException[]): RouteException[] {
  const today = new Date().toISOString().slice(0, 10)
  return exceptions.filter((e) => e.date >= today)
}

export const useRouteExceptionsStore = create<RouteExceptionsState>()(
  persist(
    (set, get) => ({
      exceptions: [],

      addException: (exception) =>
        set((state) => {
          const newException: RouteException = {
            ...exception,
            id: generateId(),
            createdAt: new Date().toISOString(),
          }
          return { exceptions: [...state.exceptions, newException] }
        }),

      removeException: (id) =>
        set((state) => ({
          exceptions: state.exceptions.filter((e) => e.id !== id),
        })),

      getExceptionsForDate: (date) =>
        get().exceptions.filter((e) => e.date === date),

      getSkipsForDate: (date, day) =>
        get().exceptions.filter((e) => e.date === date && e.day === day && e.type === 'skip'),

      getAddsForDate: (date, day) =>
        get().exceptions.filter((e) => e.date === date && e.day === day && e.type === 'add'),
    }),
    {
      name: 'kover-route-exceptions',
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<RouteExceptionsState>) }
        merged.exceptions = pruneExpiredExceptions(merged.exceptions)
        return merged
      },
    },
  ),
)
