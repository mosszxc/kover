import { create } from 'zustand'
import { syncSettingChange } from '@/shared/lib/sync/settingsSync'

interface WhatsNewState {
  lastSeenVersion: string | null
  setLastSeenVersion: (version: string) => void
}

export const useWhatsNewStore = create<WhatsNewState>()(
  (set) => ({
    lastSeenVersion: null,
    setLastSeenVersion: (version) => {
      set({ lastSeenVersion: version })
      syncSettingChange('lastSeenVersion', version)
    },
  }),
)
