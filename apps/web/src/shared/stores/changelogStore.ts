import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabaseSync, changelogAdapter } from '@/shared/lib/sync'
import { generateId } from '@/shared/lib/generateId'

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
    supabaseSync(
      {
        adapter: changelogAdapter,
        getItems: (state) => (state as ChangeLogState).entries,
        itemsKey: 'entries',
      },
    (set) => ({
      entries: [],

      addEntry: (entry) =>
        set((state) => {
          const newEntry: ChangeLogEntry = {
            ...entry,
            id: generateId(),
            timestamp: new Date().toISOString(),
          }
          const entries = [newEntry, ...state.entries].slice(0, MAX_ENTRIES)
          return { entries }
        }),

      clearEntries: () => set({ entries: [] }),
    }),
    ),
    { name: 'kover-changelog' },
  ),
)
