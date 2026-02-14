import { supabase } from '@/shared/lib/supabase'
import {
  matSizesAdapter,
  driversAdapter,
  clientsAdapter,
  changelogAdapter,
  serviceLogAdapter,
  routeStopToRemote,
} from './adapters'
import { upsertMany } from './engine'
import type { SyncAdapter, MigrationProgress, MigrationResult } from './types'
import type { Client } from '@/modules/clients/types'
import type { Driver } from '@/modules/drivers/types'
import type { DayRoute } from '@/modules/routes/types'
import type { MatSizeConfig } from '@/shared/types'
import type { ChangeLogEntry } from '@/shared/stores/changelogStore'
import type { ServiceLogEntry } from '@/shared/stores/serviceLogStore'

interface SettingsData {
  geocodeCity: string
  showWeekends: boolean
  fileSyncEnabled: boolean
  fileSyncFileName: string
}

export interface LocalData {
  matSizes: MatSizeConfig[]
  settings: SettingsData
  drivers: Driver[]
  clients: Client[]
  routes: DayRoute[]
  changelog: ChangeLogEntry[]
  serviceLog: ServiceLogEntry[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function migrateTable(
  p: MigrationProgress,
  adapter: SyncAdapter<any, any>,
  items: unknown[],
  notify: () => void,
): Promise<boolean> {
  p.status = 'syncing'
  notify()

  if (items.length === 0) {
    p.status = 'done'
    notify()
    return true
  }

  const result = await upsertMany(adapter, items)
  p.done = result.success
  p.status = result.failed > 0 ? 'error' : 'done'
  notify()
  return result.failed === 0
}

export async function migrateToSupabase(
  data: LocalData,
  onProgress?: (progress: MigrationProgress[]) => void,
): Promise<MigrationResult> {
  if (!supabase) {
    return { tables: [], success: false }
  }

  const progress: MigrationProgress[] = [
    { table: 'mat_sizes', total: data.matSizes.length, done: 0, status: 'pending' },
    { table: 'settings', total: 4, done: 0, status: 'pending' },
    { table: 'drivers', total: data.drivers.length, done: 0, status: 'pending' },
    { table: 'clients', total: data.clients.length, done: 0, status: 'pending' },
    { table: 'day_routes + route_stops', total: data.routes.length, done: 0, status: 'pending' },
    { table: 'changelog', total: data.changelog.length, done: 0, status: 'pending' },
    { table: 'service_log', total: data.serviceLog.length, done: 0, status: 'pending' },
  ]

  const notify = () => onProgress?.([...progress])
  let allSuccess = true

  // 1. Mat sizes
  if (!await migrateTable(progress[0]!, matSizesAdapter, data.matSizes, notify)) {
    allSuccess = false
  }

  // 2. Settings (key/value format)
  progress[1]!.status = 'syncing'
  notify()
  try {
    const settingsRows = [
      { key: 'geocodeCity', value: JSON.stringify(data.settings.geocodeCity) },
      { key: 'showWeekends', value: JSON.stringify(data.settings.showWeekends) },
      { key: 'fileSyncEnabled', value: JSON.stringify(data.settings.fileSyncEnabled) },
      { key: 'fileSyncFileName', value: JSON.stringify(data.settings.fileSyncFileName) },
    ]
    const { error } = await supabase
      .from('settings')
      .upsert(settingsRows, { onConflict: 'key' })
    progress[1]!.done = error ? 0 : 4
    progress[1]!.status = error ? 'error' : 'done'
    if (error) {
      progress[1]!.error = error.message
      allSuccess = false
    }
  } catch (e) {
    progress[1]!.status = 'error'
    progress[1]!.error = (e as Error).message
    allSuccess = false
  }
  notify()

  // 3. Drivers
  if (!await migrateTable(progress[2]!, driversAdapter, data.drivers, notify)) {
    allSuccess = false
  }

  // 4. Clients
  if (!await migrateTable(progress[3]!, clientsAdapter, data.clients, notify)) {
    allSuccess = false
  }

  // 5. Routes (day_routes + route_stops)
  progress[4]!.status = 'syncing'
  notify()
  try {
    const dayRouteRows = data.routes.map((r) => ({ day: r.day }))
    await supabase
      .from('day_routes')
      .upsert(dayRouteRows, { onConflict: 'day' })

    const { data: dayRoutes, error: fetchError } = await supabase
      .from('day_routes')
      .select('id, day')

    if (fetchError) throw fetchError

    const dayToId = new Map(dayRoutes!.map((dr) => [dr.day, dr.id]))

    const allStops = data.routes.flatMap((route) => {
      const dayRouteId = dayToId.get(route.day)
      if (!dayRouteId) return []
      return route.stops.map((stop) => routeStopToRemote(stop, dayRouteId))
    })

    if (allStops.length > 0) {
      const { error: stopsError } = await supabase
        .from('route_stops')
        .upsert(allStops)
      if (stopsError) throw stopsError
    }

    progress[4]!.done = data.routes.length
    progress[4]!.status = 'done'
  } catch (e) {
    progress[4]!.status = 'error'
    progress[4]!.error = (e as Error).message
    allSuccess = false
  }
  notify()

  // 6. Changelog
  if (!await migrateTable(progress[5]!, changelogAdapter, data.changelog, notify)) {
    allSuccess = false
  }

  // 7. Service log
  if (!await migrateTable(progress[6]!, serviceLogAdapter, data.serviceLog, notify)) {
    allSuccess = false
  }

  return { tables: progress, success: allSuccess }
}
