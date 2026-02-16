import { useMemo, useCallback } from 'react'
import { DatabaseOverview, MigrationPanel, ImportExcelDialog } from '@/modules/database'
import type { DatabaseStats } from '@/modules/database'
import type { ImportData } from '@/modules/database'
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

  const handleImportApply = useCallback((data: ImportData) => {
    useClientStore.getState().seedClients(data.clients)
    useDriverStore.getState().seedDrivers(data.drivers)
    useRouteStore.getState().seedRoutes(data.routes)

    // Apply mat sizes: replace all
    const store = useMatSizeStore.getState()
    const currentIds = new Set(store.sizes.map((s) => s.id))
    const importedIds = new Set(data.matSizes.map((s) => s.id))

    // Remove sizes not in import
    for (const s of store.sizes) {
      if (!importedIds.has(s.id)) store.removeSize(s.id)
    }
    // Add or update sizes from import
    for (const s of data.matSizes) {
      if (currentIds.has(s.id)) {
        store.updateSize(s.id, { label: s.label, area: s.area })
      } else {
        store.addSize(s.id, s.label, s.area)
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      <DatabaseOverview
        stats={stats}
        sheets={sheets}
        importButton={
          <ImportExcelDialog
            currentClients={clients}
            currentDrivers={drivers}
            currentRoutes={routes}
            currentMatSizes={matSizes}
            onApply={handleImportApply}
          />
        }
      />
      <MigrationPanel getLocalData={getLocalData} />
    </div>
  )
}
