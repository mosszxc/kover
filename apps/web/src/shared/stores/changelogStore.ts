import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ChangeLogEntry {
  id: string
  timestamp: string
  type: 'route' | 'client'
  action: string
  description: string
}

interface ChangeLogState {
  entries: ChangeLogEntry[]
  addEntry: (entry: Omit<ChangeLogEntry, 'id' | 'timestamp'>) => void
  clearEntries: () => void
}

const MAX_ENTRIES = 200

export const useChangeLogStore = create<ChangeLogState>()(
  persist(
    (set) => ({
      entries: [],

      addEntry: (entry) =>
        set((state) => {
          const newEntry: ChangeLogEntry = {
            ...entry,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          }
          const entries = [newEntry, ...state.entries].slice(0, MAX_ENTRIES)
          return { entries }
        }),

      clearEntries: () => set({ entries: [] }),
    }),
    { name: 'kover-changelog' },
  ),
)
