import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { syncSettingChange } from '@/shared/lib/sync/settingsSync'

type Theme = 'light' | 'dark'

interface SettingsState {
  theme: Theme
  setTheme: (theme: Theme) => void

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
      theme: 'light' as Theme,
      setTheme: (theme: Theme) => {
        set({ theme })
        document.documentElement.classList.toggle('dark', theme === 'dark')
        syncSettingChange('theme', theme)
      },

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
