import { supabase } from '@/shared/lib/supabase'
import { isHydrating } from './syncStore'
import { trackSync } from './syncQueue'
import {
  matInventoryAdapter,
  matBatchesAdapter,
  inventoryTransactionsAdapter,
} from './adapters'
import type { MatInventory, MatBatch, InventoryTransaction } from '@/modules/inventory/types'
import type { Database } from '@/shared/types/database'

type TableName = keyof Database['public']['Tables']

function diffAndSync<T extends { id?: string; sizeId?: string }>(
  prev: T[],
  next: T[],
  adapter: { table: string; toRemote: (item: T) => Record<string, unknown> },
  getId: (item: T) => string,
) {
  if (!supabase || prev === next) return

  const table = adapter.table as TableName
  const prevIds = new Set(prev.map(getId))
  const nextIds = new Set(next.map(getId))

  // Upsert changed/new
  const toUpsert: Record<string, unknown>[] = []
  const upsertIds: string[] = []
  for (const item of next) {
    const id = getId(item)
    if (!prevIds.has(id)) {
      toUpsert.push(adapter.toRemote(item))
      upsertIds.push(id)
    } else {
      const prevItem = prev.find((p) => getId(p) === id)
      if (prevItem !== item) {
        toUpsert.push(adapter.toRemote(item))
        upsertIds.push(id)
      }
    }
  }

  if (toUpsert.length > 0) {
    trackSync(
      table,
      upsertIds,
      supabase.from(table).upsert(toUpsert as never),
    )
  }

  // Delete removed
  for (const id of prevIds) {
    if (!nextIds.has(id)) {
      trackSync(
        table,
        [id],
        supabase.from(table).delete().eq('id', id),
      )
    }
  }
}

export function syncInventoryChanges(
  prev: { inventory: MatInventory[]; batches: MatBatch[]; transactions: InventoryTransaction[] },
  next: { inventory: MatInventory[]; batches: MatBatch[]; transactions: InventoryTransaction[] },
) {
  if (isHydrating()) return

  diffAndSync(
    prev.inventory,
    next.inventory,
    matInventoryAdapter,
    (item) => item.sizeId,
  )

  diffAndSync(
    prev.batches,
    next.batches,
    matBatchesAdapter,
    (item) => item.id,
  )

  diffAndSync(
    prev.transactions,
    next.transactions,
    inventoryTransactionsAdapter,
    (item) => item.id,
  )
}
