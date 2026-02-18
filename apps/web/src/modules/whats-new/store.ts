import { create } from "zustand"
import { persist } from "zustand/middleware"

interface WhatsNewState {
  lastSeenVersion: string | null
  setLastSeenVersion: (version: string) => void
}

export const useWhatsNewStore = create<WhatsNewState>()(
  persist(
    (set) => ({
      lastSeenVersion: null,
      setLastSeenVersion: (version) => set({ lastSeenVersion: version }),
    }),
    { name: "kover-whats-new" },
  ),
)
