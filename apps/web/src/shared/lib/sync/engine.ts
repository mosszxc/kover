import { supabase } from '@/shared/lib/supabase'
import type { SyncAdapter } from './types'
import type { Database } from '@/shared/types/database'

type TableName = keyof Database['public']['Tables']

/**
 * Загрузить все записи из таблицы Supabase и смаппить в локальный формат.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchAll<TLocal>(
  adapter: SyncAdapter<TLocal, any>,
): Promise<TLocal[] | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from(adapter.table as TableName)
    .select('*')

  if (error) {
    console.error(`[sync] fetch ${adapter.table}:`, error.message)
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(adapter.toLocal)
}

/**
 * Upsert массива записей в Supabase.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function upsertMany<TLocal>(
  adapter: SyncAdapter<TLocal, any>,
  items: TLocal[],
): Promise<{ success: number; failed: number }> {
  if (!supabase) return { success: 0, failed: items.length }

  const remoteItems = items.map(adapter.toRemote)

  const { error } = await supabase
    .from(adapter.table as TableName)
    .upsert(remoteItems as never)

  if (error) {
    console.error(`[sync] upsertMany ${adapter.table}:`, error.message)
    return { success: 0, failed: items.length }
  }

  return { success: items.length, failed: 0 }
}

/**
 * Подписаться на Realtime-изменения в таблице.
 * Возвращает функцию unsubscribe.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function subscribeToTable<TLocal>(
  adapter: SyncAdapter<TLocal, any>,
  onInsertOrUpdate: (item: TLocal) => void,
  onDelete: (id: string) => void,
): (() => void) | null {
  if (!supabase) return null

  const channel = supabase
    .channel(`realtime-${adapter.table}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: adapter.table },
      (payload) => {
        onInsertOrUpdate(adapter.toLocal(payload.new))
      },
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: adapter.table },
      (payload) => {
        onInsertOrUpdate(adapter.toLocal(payload.new))
      },
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: adapter.table },
      (payload) => {
        const old = payload.old as Record<string, unknown>
        if (old.id) onDelete(old.id as string)
      },
    )
    .subscribe()

  return () => {
    supabase!.removeChannel(channel)
  }
}
