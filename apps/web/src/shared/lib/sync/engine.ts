import type { RecordModel } from 'pocketbase'
import { pb, isPbReachable } from '@/shared/lib/pocketbase'
import { useSyncStore } from './syncStore'
import type { CollectionAdapter } from './types'

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyAdapter = CollectionAdapter<any>
type AnyStore = {
  getState: () => any
  setState: (partial: any) => void
  subscribe: (listener: (state: any, prev: any) => void) => () => void
}

interface RegisteredSync {
  adapter: AnyAdapter
  store: AnyStore
  unsubscribeRealtime?: () => void
  unsubscribeStore?: () => void
}

const registry: RegisteredSync[] = []
let initialized = false

/** Register a store+adapter pair for syncing */
export function registerSync<TState>(
  store: {
    getState: () => TState
    setState: (partial: Partial<TState>) => void
    subscribe: (listener: (state: TState, prev: TState) => void) => () => void
  },
  adapter: CollectionAdapter<TState>,
): void {
  registry.push({ adapter, store })
}

/** Initialize all syncs: hydrate from PB, subscribe to realtime, watch store changes */
export async function initSync(): Promise<void> {
  if (initialized) return

  const sync = useSyncStore.getState()
  sync.setStatus('connecting')

  const reachable = await isPbReachable()
  if (!reachable) {
    sync.setStatus('offline')
    return
  }

  // Validate auth token server-side before syncing
  if (pb.authStore.isValid) {
    try {
      await pb.collection('users').authRefresh()
    } catch {
      console.warn('[sync] Auth token invalid, clearing session')
      pb.authStore.clear()
      sync.setStatus('offline')
      return
    }
  }

  try {
    // Hydrate all stores from PocketBase
    for (const { adapter, store } of registry) {
      const records = await pb.collection(adapter.collection).getFullList()
      if (records.length > 0) {
        const partial = adapter.fromRecords(records)
        store.setState(partial)
      }
    }

    // Subscribe to realtime updates
    for (const entry of registry) {
      const unsub = await subscribeRealtime(entry)
      entry.unsubscribeRealtime = unsub
    }

    // Watch store changes for write-through
    for (const entry of registry) {
      const unsub = watchStore(entry)
      entry.unsubscribeStore = unsub
    }

    sync.setStatus('online')
    sync.setLastSyncAt(new Date().toISOString())
    initialized = true
  } catch (err) {
    console.error('[sync] Init failed:', err)
    sync.setStatus('offline')
    sync.setError(err instanceof Error ? err.message : 'Sync init failed')
  }
}

/** Tear down all syncs */
export function destroySync(): void {
  for (const entry of registry) {
    entry.unsubscribeRealtime?.()
    entry.unsubscribeStore?.()
  }
  initialized = false
  useSyncStore.getState().setStatus('offline')
}

// Flag to prevent write-through during realtime updates
let realtimeUpdating = false

/** Subscribe to PocketBase realtime events for a collection */
async function subscribeRealtime(entry: RegisteredSync): Promise<() => void> {
  const { adapter, store } = entry

  await pb.collection(adapter.collection).subscribe('*', (e) => {
    if (e.action === 'delete') {
      realtimeUpdating = true
      try {
        removeRecord(adapter, store, e.record)
      } finally {
        realtimeUpdating = false
      }
    } else {
      // Re-fetch full list to keep state consistent
      pb.collection(adapter.collection).getFullList().then((allRecords) => {
        realtimeUpdating = true
        try {
          const partial = adapter.fromRecords(allRecords)
          store.setState(partial)
        } finally {
          realtimeUpdating = false
        }
      })
    }
  })

  return () => {
    pb.collection(adapter.collection).unsubscribe('*')
  }
}

function removeRecord(
  adapter: AnyAdapter,
  store: AnyStore,
  deletedRecord: RecordModel,
): void {
  const currentState = store.getState()
  const currentRecords = adapter.toRecords(currentState)
  const filtered = currentRecords.filter((r: { id: string }) => r.id !== deletedRecord.id)
  const fakeRecords = filtered.map((r: any) => ({ ...r }) as RecordModel)
  const partial = adapter.fromRecords(fakeRecords)
  store.setState(partial)
}

/** Watch Zustand store changes and push to PocketBase (write-through) */
function watchStore(entry: RegisteredSync): () => void {
  const { adapter, store } = entry
  let prevRecords = adapter.toRecords(store.getState())

  return store.subscribe((state: any) => {
    if (realtimeUpdating) return
    if (useSyncStore.getState().status !== 'online') return

    const nextRecords = adapter.toRecords(state)
    diffAndSync(adapter, prevRecords, nextRecords)
    prevRecords = nextRecords
  })
}

/** Diff old vs new records and push create/update/delete to PocketBase */
function diffAndSync(
  adapter: AnyAdapter,
  prev: ({ id: string } & Record<string, unknown>)[],
  next: ({ id: string } & Record<string, unknown>)[],
): void {
  const prevMap = new Map(prev.map((r) => [r.id, r]))
  const nextMap = new Map(next.map((r) => [r.id, r]))

  // Creates
  for (const [id, record] of nextMap) {
    if (!prevMap.has(id)) {
      const body = adapter.toBody(record as any)
      pb.collection(adapter.collection).create({ id, ...body }).catch((err) => {
        console.error(`[sync] Create ${adapter.collection}/${id} failed:`, err)
      })
    }
  }

  // Updates
  for (const [id, record] of nextMap) {
    const prevRecord = prevMap.get(id)
    if (prevRecord && JSON.stringify(prevRecord) !== JSON.stringify(record)) {
      const body = adapter.toBody(record as any)
      pb.collection(adapter.collection).update(id, body).catch((err) => {
        console.error(`[sync] Update ${adapter.collection}/${id} failed:`, err)
      })
    }
  }

  // Deletes
  for (const [id] of prevMap) {
    if (!nextMap.has(id)) {
      pb.collection(adapter.collection).delete(id).catch((err) => {
        console.error(`[sync] Delete ${adapter.collection}/${id} failed:`, err)
      })
    }
  }
}

/** One-time migration: push all localStorage data to PocketBase */
export async function migrateLocalStorageToPb(): Promise<void> {
  await migrateWithProgress()
}

export interface MigrationCollectionResult {
  collection: string
  created: number
  updated: number
  skipped: number
  failed: number
  total: number
}

export interface MigrationResult {
  collections: MigrationCollectionResult[]
  totalCreated: number
  totalUpdated: number
  totalSkipped: number
  totalFailed: number
}

/**
 * One-time migration with per-collection progress reporting.
 * Returns detailed results per collection.
 */
export async function migrateWithProgress(
  onProgress?: (current: MigrationCollectionResult, index: number, total: number) => void,
): Promise<MigrationResult> {
  const sync = useSyncStore.getState()

  const reachable = await isPbReachable()
  if (!reachable) throw new Error('PocketBase недоступен')

  const collections: MigrationCollectionResult[] = []

  for (let i = 0; i < registry.length; i++) {
    const entry = registry[i]!
    const { adapter, store } = entry
    const records = adapter.toRecords(store.getState())

    const result: MigrationCollectionResult = {
      collection: adapter.collection,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      total: records.length,
    }

    if (records.length === 0) {
      collections.push(result)
      onProgress?.(result, i, registry.length)
      continue
    }

    // Check if collection already has data
    const existing = await pb.collection(adapter.collection).getFullList({ fields: 'id' })
    if (existing.length > 0) {
      result.skipped = records.length
      collections.push(result)
      onProgress?.(result, i, registry.length)
      continue
    }

    for (const record of records) {
      const body = adapter.toBody(record)
      try {
        await pb.collection(adapter.collection).create({ id: record.id, ...body })
        result.created++
      } catch (err) {
        console.error(`[sync] Migration create ${adapter.collection}/${record.id} failed:`, err)
        result.failed++
      }
    }

    collections.push(result)
    onProgress?.(result, i, registry.length)
  }

  sync.setMigrated(true)

  return {
    collections,
    totalCreated: collections.reduce((s, c) => s + c.created, 0),
    totalUpdated: collections.reduce((s, c) => s + c.updated, 0),
    totalSkipped: collections.reduce((s, c) => s + c.skipped, 0),
    totalFailed: collections.reduce((s, c) => s + c.failed, 0),
  }
}

/**
 * Sync localStorage data to PocketBase (upsert: create new, update existing).
 * Unlike migration, does not skip collections that already have data.
 */
export async function syncWithProgress(
  onProgress?: (current: MigrationCollectionResult, index: number, total: number) => void,
): Promise<MigrationResult> {
  const reachable = await isPbReachable()
  if (!reachable) throw new Error('PocketBase недоступен')

  const collections: MigrationCollectionResult[] = []

  for (let i = 0; i < registry.length; i++) {
    const entry = registry[i]!
    const { adapter, store } = entry
    const records = adapter.toRecords(store.getState())

    const result: MigrationCollectionResult = {
      collection: adapter.collection,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      total: records.length,
    }

    if (records.length === 0) {
      collections.push(result)
      onProgress?.(result, i, registry.length)
      continue
    }

    // Get existing record IDs
    const existing = await pb.collection(adapter.collection).getFullList({ fields: 'id' })
    const existingIds = new Set(existing.map((r) => r.id))

    for (const record of records) {
      const body = adapter.toBody(record)
      try {
        if (existingIds.has(record.id)) {
          await pb.collection(adapter.collection).update(record.id, body)
          result.updated++
        } else {
          await pb.collection(adapter.collection).create({ id: record.id, ...body })
          result.created++
        }
      } catch (err) {
        console.error(`[sync] Sync ${adapter.collection}/${record.id} failed:`, err)
        result.failed++
      }
    }

    collections.push(result)
    onProgress?.(result, i, registry.length)
  }

  return {
    collections,
    totalCreated: collections.reduce((s, c) => s + c.created, 0),
    totalUpdated: collections.reduce((s, c) => s + c.updated, 0),
    totalSkipped: collections.reduce((s, c) => s + c.skipped, 0),
    totalFailed: collections.reduce((s, c) => s + c.failed, 0),
  }
}
