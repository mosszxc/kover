import { toast } from 'sonner'

/** Pending sync promises tracked for awaiting */
let pendingPromises: PromiseLike<void>[] = []

/** Record IDs that failed to sync, per table */
const unsyncedIds = new Map<string, Set<string>>()

/**
 * Track a Supabase upsert/delete promise.
 * Shows toast on error, marks failed records as unsynced.
 */
export function trackSync(
  table: string,
  ids: string[],
  promise: PromiseLike<{ error: { message: string } | null }>,
) {
  const p = promise.then(({ error }) => {
    if (error) {
      console.error(`[sync] ${table}:`, error.message)
      toast.error(`Ошибка синхронизации: ${error.message}`)
      if (!unsyncedIds.has(table)) unsyncedIds.set(table, new Set())
      const set = unsyncedIds.get(table)!
      for (const id of ids) set.add(id)
    } else {
      const set = unsyncedIds.get(table)
      if (set) {
        for (const id of ids) set.delete(id)
        if (set.size === 0) unsyncedIds.delete(table)
      }
      window.dispatchEvent(new CustomEvent('kover-synced'))
    }
  })
  pendingPromises.push(p)
}

/**
 * Wait for all pending sync operations to complete.
 */
export async function waitForSync(): Promise<void> {
  while (pendingPromises.length > 0) {
    const batch = pendingPromises.splice(0)
    await Promise.allSettled(batch.map((p) => Promise.resolve(p)))
  }
}

/**
 * Get IDs that failed to sync for a given table.
 * Used by hydration to protect unsynced local data.
 */
export function getUnsyncedIds(table: string): ReadonlySet<string> {
  return unsyncedIds.get(table) ?? new Set()
}

/**
 * Check if there are any pending or failed syncs.
 */
export function hasPendingSyncs(): boolean {
  return pendingPromises.length > 0
}
