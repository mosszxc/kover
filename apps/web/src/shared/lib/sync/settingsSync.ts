import { supabase } from '@/shared/lib/supabase'
import type { Json } from '@/shared/types/database'

/**
 * Write-through sync для settings → Supabase (key/value format).
 */
export function syncSettingChange(key: string, value: Json) {
  if (!supabase) return

  supabase
    .from('settings')
    .upsert({ key, value }, { onConflict: 'key' })
    .then(({ error }) => {
      if (error) console.error(`[sync] settings upsert ${key}:`, error.message)
    })
}
