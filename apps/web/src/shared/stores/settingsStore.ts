import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { syncSettingChange } from '@/shared/lib/sync/settingsSync'

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

  notificationsEnabled: boolean
  setNotificationsEnabled: (enabled: boolean) => void

  autostartEnabled: boolean
  setAutostartEnabled: (enabled: boolean) => void

  startMinimized: boolean
  setStartMinimized: (minimized: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      geocodeCity: '',
      setGeocodeCity: (city) => {
        const trimmed = city.trim()
        set({ geocodeCity: trimmed })
        syncSettingChange('geocodeCity', trimmed)
      },

      showWeekends: true,
      setShowWeekends: (show) => {
        set({ showWeekends: show })
        syncSettingChange('showWeekends', show)
      },

      fileSyncEnabled: false,
      fileSyncFileName: '',
      lastFileSyncAt: null,
      setFileSyncEnabled: (enabled) => {
        set({ fileSyncEnabled: enabled })
        syncSettingChange('fileSyncEnabled', enabled)
      },
      setFileSyncFileName: (name) => {
        set({ fileSyncFileName: name })
        syncSettingChange('fileSyncFileName', name)
      },
      setLastFileSyncAt: (timestamp) => set({ lastFileSyncAt: timestamp }),

      notificationsEnabled: true,
      setNotificationsEnabled: (enabled) => {
        set({ notificationsEnabled: enabled })
        syncSettingChange('notificationsEnabled', enabled)
      },

      autostartEnabled: false,
      setAutostartEnabled: (enabled) => {
        set({ autostartEnabled: enabled })
        syncSettingChange('autostartEnabled', enabled)
      },

      startMinimized: false,
      setStartMinimized: (minimized) => {
        set({ startMinimized: minimized })
        syncSettingChange('startMinimized', minimized)
      },
    }),
    { name: 'kover-settings' },
  ),
)
