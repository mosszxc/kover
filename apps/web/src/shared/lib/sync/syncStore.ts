import { create } from 'zustand'
import type { SyncState, SyncStatus } from './types'

interface SyncStoreState extends SyncState {
  setStatus: (status: SyncStatus) => void
  setError: (error: string | null) => void
  setSynced: () => void
}

export const useSyncStore = create<SyncStoreState>()((set) => ({
  status: 'idle',
  lastSyncAt: null,
  error: null,

  setStatus: (status) => set({ status, error: status === 'syncing' ? null : undefined }),
  setError: (error) => set({ status: 'error', error }),
  setSynced: () =>
    set({
      status: 'idle',
      lastSyncAt: new Date().toISOString(),
      error: null,
    }),
}))
