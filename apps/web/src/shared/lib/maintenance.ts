import { supabase } from '@/shared/lib/supabase'

export interface MaintenanceConfig {
  enabled: boolean
  message: string
  estimatedReturn: string | null
}

const DEFAULT_CONFIG: MaintenanceConfig = {
  enabled: false,
  message: 'Проводим технические работы. Скоро вернёмся!',
  estimatedReturn: null,
}

async function fetchFromSupabase(): Promise<MaintenanceConfig | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'maintenance')
    .single()

  if (error || !data) return null
  return data.value as unknown as MaintenanceConfig
}

async function fetchFromConfigJson(): Promise<MaintenanceConfig | null> {
  try {
    const response = await fetch('/config.json', { cache: 'no-store' })
    if (!response.ok) return null
    const config = await response.json()
    return config.maintenance ?? null
  } catch {
    return null
  }
}

export async function fetchMaintenanceConfig(): Promise<MaintenanceConfig> {
  // Try Supabase first, fall back to config.json
  const fromSupabase = await fetchFromSupabase()
  if (fromSupabase) return fromSupabase

  const fromJson = await fetchFromConfigJson()
  if (fromJson) return fromJson

  return DEFAULT_CONFIG
}
