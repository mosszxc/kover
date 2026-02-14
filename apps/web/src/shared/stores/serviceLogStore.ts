import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DayOfWeek } from '@/shared/types'
import { supabaseSync, serviceLogAdapter } from '@/shared/lib/sync'

export type ServiceEventType =
  | 'completed'
  | 'removed'
  | 'transferred'
  | 'paused'
  | 'unpaused'
  | 'skipped'

export interface ServiceLogEntry {
  id: string
  clientId: string
  timestamp: string
  day: DayOfWeek
  type: ServiceEventType
  driverName?: string
  /** For transfers: target day */
  targetDay?: DayOfWeek
}

interface ServiceLogState {
  entries: ServiceLogEntry[]
  addEntry: (entry: Omit<ServiceLogEntry, 'id' | 'timestamp'>) => void
  getClientHistory: (clientId: string) => ServiceLogEntry[]
}

const RETENTION_DAYS = 90

function pruneOldEntries(entries: ServiceLogEntry[]): ServiceLogEntry[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)
  const cutoffStr = cutoff.toISOString()
  return entries.filter((e) => e.timestamp >= cutoffStr)
}

export const useServiceLogStore = create<ServiceLogState>()(
  persist(
    supabaseSync(
      {
        adapter: serviceLogAdapter,
        getItems: (state) => (state as ServiceLogState).entries,
        itemsKey: 'entries',
      },
    (set, get) => ({
      entries: [],

      addEntry: (entry) =>
        set((state) => {
          const newEntry: ServiceLogEntry = {
            ...entry,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          }
          const entries = pruneOldEntries([newEntry, ...state.entries])
          return { entries }
        }),

      getClientHistory: (clientId) =>
        get().entries.filter((e) => e.clientId === clientId),
    }),
    ),
    { name: 'kover-service-log' },
  ),
)
