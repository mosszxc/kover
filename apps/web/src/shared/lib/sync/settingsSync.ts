import { supabase } from '@/shared/lib/supabase'

/**
 * Write-through sync для settings → Supabase (key/value format).
 */
export function syncSettingChange(key: string, value: unknown) {
  if (!supabase) return

  supabase
    .from('settings')
    .upsert({ key, value: JSON.stringify(value) }, { onConflict: 'key' })
    .then(({ error }) => {
      if (error) console.error(`[sync] settings upsert ${key}:`, error.message)
    })
}
