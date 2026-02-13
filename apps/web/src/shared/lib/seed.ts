import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SeedState {
  isSeeded: boolean
  markSeeded: () => void
}

export const useSeedStore = create<SeedState>()(
  persist(
    (set) => ({
      isSeeded: false,
      markSeeded: () => set({ isSeeded: true }),
    }),
    {
      name: 'kover-seed',
      version: 2,
      migrate: () => {
        // v1→v2: routes changed from blocks to flat — force re-seed
        return { isSeeded: false }
      },
    },
  ),
)
