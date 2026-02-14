import type { RecordModel } from 'pocketbase'

export type SyncStatus = 'offline' | 'connecting' | 'online' | 'error'

/** Adapter maps between Zustand state shape and PocketBase records */
export interface CollectionAdapter<TState, TRecord extends Record<string, unknown> = Record<string, unknown>> {
  /** PocketBase collection name */
  collection: string

  /**
   * Extract the array of items from Zustand state.
   * For single-record collections (settings), return a 1-element array.
   */
  toRecords: (state: TState) => (TRecord & { id: string })[]

  /**
   * Build Zustand partial state from PocketBase records.
   * Called during hydration and realtime updates.
   */
  fromRecords: (records: RecordModel[]) => Partial<TState>

  /**
   * Map a single Zustand item to PB body (without id).
   * Used for create/update calls.
   */
  toBody: (item: TRecord & { id: string }) => Record<string, unknown>
}
