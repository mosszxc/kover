import { create } from 'zustand'
import { temporal } from 'zundo'
import type { Driver } from './types'
import { supabaseSync, driversAdapter } from '@/shared/lib/sync'

interface DriverState {
  drivers: Driver[]
  addDriver: (driver: Driver) => void
  updateDriver: (id: string, data: Partial<Driver>) => void
  deleteDriver: (id: string) => void
  seedDrivers: (drivers: Driver[]) => void
}

export const useDriverStore = create<DriverState>()(
  temporal(
    supabaseSync(
      {
        adapter: driversAdapter,
        getItems: (state) => (state as DriverState).drivers,
        itemsKey: 'drivers',
      },
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
    ),
    {
      limit: 20,
      partialize: (state) => {
        const { drivers } = state
        return { drivers } as DriverState
      },
    },
  ),
)
