import { create } from 'zustand'
import { syncSettingChange } from '@/shared/lib/sync/settingsSync'

interface RouteSettingsState {
  maxStopsPerDay: number
  setMaxStopsPerDay: (value: number) => void
}

export const useRouteSettingsStore = create<RouteSettingsState>()(
  (set) => ({
    maxStopsPerDay: 50,
    setMaxStopsPerDay: (value) => {
      set({ maxStopsPerDay: value })
      syncSettingChange('maxStopsPerDay', value)
    },
  }),
)
