export interface SyncAdapter<TLocal, TRemote> {
  table: string
  toRemote: (local: TLocal) => TRemote
  toLocal: (remote: TRemote) => TLocal
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline'

export interface SyncState {
  status: SyncStatus
  lastSyncAt: string | null
  error: string | null
}

export interface MigrationProgress {
  table: string
  total: number
  done: number
  status: 'pending' | 'syncing' | 'done' | 'error'
  error?: string
}

export interface MigrationResult {
  tables: MigrationProgress[]
  success: boolean
}
