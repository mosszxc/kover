import { registerSync } from './engine'
import {
  matSizesAdapter,
  settingsAdapter,
  driversAdapter,
  clientsAdapter,
  changelogAdapter,
  dayRoutesAdapter,
  routeStopsAdapter,
} from './adapters'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import { useSettingsStore } from '@/shared/stores/settingsStore'
import { useChangeLogStore } from '@/shared/stores/changelogStore'
import { useClientStore } from '@/modules/clients/store'
import { useDriverStore } from '@/modules/drivers/store'
import { useRouteStore } from '@/modules/routes/store'

let registered = false

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Register all stores with their sync adapters. Call once at app startup. */
export function registerAllSyncs(): void {
  if (registered) return
  registered = true

  // Simple collections (order: simplest → most complex)
  registerSync(useMatSizeStore as any, matSizesAdapter)
  registerSync(useSettingsStore as any, settingsAdapter)
  registerSync(useDriverStore as any, driversAdapter)
  registerSync(useClientStore as any, clientsAdapter)
  registerSync(useChangeLogStore as any, changelogAdapter)

  // Routes: day containers first, then stops
  registerSync(useRouteStore as any, dayRoutesAdapter)
  registerSync(useRouteStore as any, routeStopsAdapter)
}
