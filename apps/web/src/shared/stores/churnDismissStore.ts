import { create } from 'zustand'
import { syncSettingChange } from '@/shared/lib/sync/settingsSync'

export interface ChurnDismiss {
  clientId: string
  dismissedAt: string
}

interface ChurnDismissState {
  dismissals: ChurnDismiss[]
  dismiss: (clientId: string) => void
  undismiss: (clientId: string) => void
  isDismissed: (clientId: string) => boolean
}

const DISMISS_EXPIRY_DAYS = 30

function isExpired(dismissedAt: string): boolean {
  const diff = Date.now() - new Date(dismissedAt).getTime()
  return diff > DISMISS_EXPIRY_DAYS * 24 * 60 * 60 * 1000
}

function pruneExpired(dismissals: ChurnDismiss[]): ChurnDismiss[] {
  return dismissals.filter((d) => !isExpired(d.dismissedAt))
}

export const useChurnDismissStore = create<ChurnDismissState>()(
  (set, get) => ({
    dismissals: [],

    dismiss: (clientId) =>
      set((state) => {
        const pruned = pruneExpired(state.dismissals)
        const existing = pruned.find((d) => d.clientId === clientId)
        let dismissals: ChurnDismiss[]
        if (existing) {
          dismissals = pruned.map((d) =>
            d.clientId === clientId
              ? { ...d, dismissedAt: new Date().toISOString() }
              : d,
          )
        } else {
          dismissals = [
            ...pruned,
            { clientId, dismissedAt: new Date().toISOString() },
          ]
        }
        syncSettingChange('churnDismissals', dismissals as unknown as import('@/shared/types/database').Json)
        return { dismissals }
      }),

    undismiss: (clientId) =>
      set((state) => {
        const dismissals = state.dismissals.filter((d) => d.clientId !== clientId)
        syncSettingChange('churnDismissals', dismissals as unknown as import('@/shared/types/database').Json)
        return { dismissals }
      }),

    isDismissed: (clientId) => {
      const d = get().dismissals.find((d) => d.clientId === clientId)
      if (!d) return false
      return !isExpired(d.dismissedAt)
    },
  }),
)
