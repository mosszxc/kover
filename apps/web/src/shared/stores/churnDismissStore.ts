import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  persist(
    (set, get) => ({
      dismissals: [],

      dismiss: (clientId) =>
        set((state) => {
          const pruned = pruneExpired(state.dismissals)
          const existing = pruned.find((d) => d.clientId === clientId)
          if (existing) {
            return {
              dismissals: pruned.map((d) =>
                d.clientId === clientId
                  ? { ...d, dismissedAt: new Date().toISOString() }
                  : d,
              ),
            }
          }
          return {
            dismissals: [
              ...pruned,
              { clientId, dismissedAt: new Date().toISOString() },
            ],
          }
        }),

      undismiss: (clientId) =>
        set((state) => ({
          dismissals: state.dismissals.filter((d) => d.clientId !== clientId),
        })),

      isDismissed: (clientId) => {
        const d = get().dismissals.find((d) => d.clientId === clientId)
        if (!d) return false
        return !isExpired(d.dismissedAt)
      },
    }),
    { name: 'kover-churn-dismiss', version: 1 },
  ),
)
