import type { StateCreator, StoreMutatorIdentifier } from 'zustand'
import { supabase } from '@/shared/lib/supabase'
import type { SyncAdapter } from './types'
import type { Database } from '@/shared/types/database'
import { trackSync } from './syncQueue'
import { isHydrating } from './syncStore'

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
 * Все операции отслеживаются через syncQueue — ошибки показываются пользователю.
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

      if (!supabase || isHydrating()) return

      const prevItems = config.getItems(prevState)
      const nextItems = config.getItems(nextState)

      if (prevItems === nextItems) return

      const prevIds = new Set(prevItems.map((i) => i.id))

      // Upsert changed/new items
      const toUpsert: Record<string, unknown>[] = []
      const upsertIds: string[] = []
      for (const item of nextItems) {
        if (!prevIds.has(item.id)) {
          toUpsert.push(config.adapter.toRemote(item))
          upsertIds.push(item.id)
        } else {
          const prevItem = prevItems.find((p) => p.id === item.id)
          if (prevItem !== item) {
            toUpsert.push(config.adapter.toRemote(item))
            upsertIds.push(item.id)
          }
        }
      }

      const table = config.adapter.table as TableName

      if (toUpsert.length > 0) {
        trackSync(
          table,
          upsertIds,
          supabase.from(table).upsert(toUpsert as never),
        )
      }

      // Delete removed items
      const nextIds = new Set(nextItems.map((i) => i.id))
      for (const id of prevIds) {
        if (!nextIds.has(id)) {
          trackSync(
            table,
            [id],
            supabase.from(table).delete().eq('id', id),
          )
        }
      }
    }) as typeof set

    return f(syncSet, get, api)
  }
}
