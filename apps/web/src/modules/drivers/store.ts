import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { temporal } from 'zundo'
import type { Driver } from './types'

interface DriverState {
  drivers: Driver[]
  addDriver: (driver: Driver) => void
  updateDriver: (id: string, data: Partial<Driver>) => void
  deleteDriver: (id: string) => void
  seedDrivers: (drivers: Driver[]) => void
}

export const useDriverStore = create<DriverState>()(
  persist(
    temporal(
      (set) => ({
        drivers: [],

        addDriver: (driver) =>
          set((state) => ({ drivers: [...state.drivers, driver] })),

        updateDriver: (id, data) =>
          set((state) => ({
            drivers: state.drivers.map((d) =>
              d.id === id ? { ...d, ...data } : d,
            ),
          })),

        deleteDriver: (id) =>
          set((state) => ({
            drivers: state.drivers.filter((d) => d.id !== id),
          })),

        seedDrivers: (drivers) => set({ drivers }),
      }),
      {
        limit: 20,
        partialize: (state) => {
          const { drivers } = state
          return { drivers } as DriverState
        },
      },
    ),
    {
      name: 'kover-drivers',
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>
        if (version < 2) {
          const drivers = (state.drivers ?? []) as Record<string, unknown>[]
          state.drivers = drivers.map((d) => ({
            ...d,
            workDays: d.workDays ?? [0, 1, 2, 3, 4],
          }))
        }
        return state as unknown as DriverState
      },
    },
  ),
)
