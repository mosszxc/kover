import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SyncStatus } from './types'

interface SyncState {
  status: SyncStatus
  /** Whether localStorage data has been migrated to PocketBase */
  isMigrated: boolean
  /** Last successful sync timestamp */
  lastSyncAt: string | null
  /** Error message if status is 'error' */
  error: string | null

  setStatus: (status: SyncStatus) => void
  setMigrated: (migrated: boolean) => void
  setLastSyncAt: (timestamp: string | null) => void
  setError: (error: string | null) => void
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      status: 'offline',
      isMigrated: false,
      lastSyncAt: null,
      error: null,

      setStatus: (status) => set({ status, error: status === 'online' ? null : undefined }),
      setMigrated: (migrated) => set({ isMigrated: migrated }),
      setLastSyncAt: (timestamp) => set({ lastSyncAt: timestamp }),
      setError: (error) => set({ error, status: 'error' }),
    }),
    { name: 'kover-sync' },
  ),
)
