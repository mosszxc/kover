import type { StateCreator, StoreMutatorIdentifier } from 'zustand'
import { supabase } from '@/shared/lib/supabase'
import type { SyncAdapter } from './types'
import type { Database } from '@/shared/types/database'

type TableName = keyof Database['public']['Tables']

interface SupabaseSyncConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: SyncAdapter<any, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getItems: (state: any) => any[]
  itemsKey: string
}

/**
 * Zustand middleware для write-through синхронизации с Supabase.
 *
 * При каждом set() сравнивает текущий массив с предыдущим и upsert'ит изменённые записи.
 * Удалённые записи отправляет как delete.
 */
export function supabaseSync<
  T extends object,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  config: SupabaseSyncConfig,
  f: StateCreator<T, Mps, Mcs>,
): StateCreator<T, Mps, Mcs> {
  return (set, get, api) => {
    const syncSet = ((...args: unknown[]) => {
      const prevState = get()
      ;(set as (...a: unknown[]) => void)(...args)
      const nextState = get()

      if (!supabase) return

      const prevItems = config.getItems(prevState)
      const nextItems = config.getItems(nextState)

      if (prevItems === nextItems) return

      const prevIds = new Set(prevItems.map((i) => i.id))

      // Upsert changed/new items
      const toUpsert: Record<string, unknown>[] = []
      for (const item of nextItems) {
        if (!prevIds.has(item.id)) {
          toUpsert.push(config.adapter.toRemote(item))
        } else {
          const prevItem = prevItems.find((p) => p.id === item.id)
          if (prevItem !== item) {
            toUpsert.push(config.adapter.toRemote(item))
          }
        }
      }

      const table = config.adapter.table as TableName

      if (toUpsert.length > 0) {
        supabase
          .from(table)
          .upsert(toUpsert as never)
          .then(({ error }) => {
            if (error) console.error(`[sync] write-through ${table}:`, error.message)
          })
      }

      // Delete removed items
      const nextIds = new Set(nextItems.map((i) => i.id))
      for (const id of prevIds) {
        if (!nextIds.has(id)) {
          supabase
            .from(table)
            .delete()
            .eq('id', id)
            .then(({ error }) => {
              if (error) console.error(`[sync] delete ${table}:`, error.message)
            })
        }
      }
    }) as typeof set

    return f(syncSet, get, api)
  }
}
