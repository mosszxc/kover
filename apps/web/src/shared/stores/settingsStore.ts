import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  geocodeCity: string
  setGeocodeCity: (city: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      geocodeCity: '',
      setGeocodeCity: (city) => set({ geocodeCity: city.trim() }),
    }),
    { name: 'kover-settings' },
  ),
)
