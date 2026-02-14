import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  geocodeCity: string
  setGeocodeCity: (city: string) => void

  showWeekends: boolean
  setShowWeekends: (show: boolean) => void

  fileSyncEnabled: boolean
  fileSyncFileName: string
  lastFileSyncAt: string | null
  setFileSyncEnabled: (enabled: boolean) => void
  setFileSyncFileName: (name: string) => void
  setLastFileSyncAt: (timestamp: string | null) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      geocodeCity: '',
      setGeocodeCity: (city) => set({ geocodeCity: city.trim() }),

      showWeekends: true,
      setShowWeekends: (show) => set({ showWeekends: show }),

      fileSyncEnabled: false,
      fileSyncFileName: '',
      lastFileSyncAt: null,
      setFileSyncEnabled: (enabled) => set({ fileSyncEnabled: enabled }),
      setFileSyncFileName: (name) => set({ fileSyncFileName: name }),
      setLastFileSyncAt: (timestamp) => set({ lastFileSyncAt: timestamp }),
    }),
    { name: 'kover-settings' },
  ),
)
