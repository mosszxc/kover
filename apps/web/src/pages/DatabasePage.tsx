import { useMemo, useCallback } from 'react'
import { DatabaseOverview, MigrationPanel } from '@/modules/database'
import type { DatabaseStats } from '@/modules/database'
import { useClientStore } from '@/modules/clients'
import { useDriverStore } from '@/modules/drivers'
import { useRouteStore } from '@/modules/routes'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import { useSettingsStore } from '@/shared/stores/settingsStore'
import { useChangeLogStore } from '@/shared/stores/changelogStore'
import { useServiceLogStore } from '@/shared/stores/serviceLogStore'
import { buildExportSheets } from '@/modules/database/lib/buildExportSheets'
import type { LocalData } from '@/shared/lib/sync'

export function DatabasePage() {
  const clients = useClientStore((s) => s.clients)
  const drivers = useDriverStore((s) => s.drivers)
  const routes = useRouteStore((s) => s.routes)
  const matSizes = useMatSizeStore((s) => s.sizes)
  const serviceLog = useServiceLogStore((s) => s.entries)

  const stats: DatabaseStats = useMemo(() => ({
    clients: clients.length,
    activeClients: clients.filter((c) => c.isActive).length,
    drivers: drivers.length,
    activeDrivers: drivers.filter((d) => d.isActive).length,
    matSizes: matSizes.length,
    totalStops: routes.reduce((sum, r) => sum + r.stops.length, 0),
  }), [clients, drivers, routes, matSizes])

  const sheets = useMemo(
    () => buildExportSheets({ clients, drivers, routes, matSizes, serviceLog }),
    [clients, drivers, routes, matSizes, serviceLog],
  )

  const getLocalData = useCallback((): LocalData => {
    const settings = useSettingsStore.getState()
    const changelog = useChangeLogStore.getState().entries

    return {
      matSizes,
      settings: {
        geocodeCity: settings.geocodeCity,
        showWeekends: settings.showWeekends,
        fileSyncEnabled: settings.fileSyncEnabled,
        fileSyncFileName: settings.fileSyncFileName,
      },
      drivers,
      clients,
      routes,
      changelog,
      serviceLog,
    }
  }, [matSizes, drivers, clients, routes, serviceLog])

  return (
    <div className="space-y-6">
      <DatabaseOverview stats={stats} sheets={sheets} />
      <MigrationPanel getLocalData={getLocalData} />
    </div>
  )
}
