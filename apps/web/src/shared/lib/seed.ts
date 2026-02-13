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
    { name: 'kover-seed', version: 1 },
  ),
)
