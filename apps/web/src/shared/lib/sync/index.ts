export { useSyncProvider } from './SyncProvider'
export { useSyncStore, isHydrating, setHydrating } from './syncStore'
export { supabaseSync } from './supabaseSync'
export { migrateToSupabase } from './migrate'
export { waitForSync } from './syncQueue'
export type { LocalData } from './migrate'
export type { SyncStatus, MigrationProgress, MigrationResult } from './types'
export {
  matSizesAdapter,
  driversAdapter,
  clientsAdapter,
  changelogAdapter,
  serviceLogAdapter,
} from './adapters'
