import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface RouteSettingsState {
  maxStopsPerDay: number
  setMaxStopsPerDay: (value: number) => void
}

export const useRouteSettingsStore = create<RouteSettingsState>()(
  persist(
    (set) => ({
      maxStopsPerDay: 50,
      setMaxStopsPerDay: (value) => set({ maxStopsPerDay: value }),
    }),
    { name: 'kover-route-settings' },
  ),
)
