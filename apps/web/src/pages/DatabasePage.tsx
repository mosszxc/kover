import { useMemo, useCallback } from 'react'
import { DatabaseOverview, MigrationPanel } from '@/modules/database'
import type { SheetData, DatabaseStats } from '@/modules/database'
import { useClientStore } from '@/modules/clients'
import { useDriverStore } from '@/modules/drivers'
import { useRouteStore } from '@/modules/routes'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import { useSettingsStore } from '@/shared/stores/settingsStore'
import { useChangeLogStore } from '@/shared/stores/changelogStore'
import { useServiceLogStore } from '@/shared/stores/serviceLogStore'
import { DAY_LABELS_FULL } from '@/shared/types'
import type { DayOfWeek } from '@/shared/types'
import type { LocalData } from '@/shared/lib/sync'

export function DatabasePage() {
  const clients = useClientStore((s) => s.clients)
  const drivers = useDriverStore((s) => s.drivers)
  const routes = useRouteStore((s) => s.routes)
  const matSizes = useMatSizeStore((s) => s.sizes)

  const stats: DatabaseStats = useMemo(() => ({
    clients: clients.length,
    activeClients: clients.filter((c) => c.isActive).length,
    drivers: drivers.length,
    activeDrivers: drivers.filter((d) => d.isActive).length,
    matSizes: matSizes.length,
    totalStops: routes.reduce((sum, r) => sum + r.stops.length, 0),
  }), [clients, drivers, routes, matSizes])

  const sheets: SheetData[] = useMemo(() => {
    const clientSheet: SheetData = {
      name: 'Клиенты',
      header: ['Имя', 'Адрес', 'Коврики', 'Дни обслуживания', 'Частота', 'Заметки', 'Активен'],
      rows: clients.map((c) => [
        c.name,
        c.address,
        c.mats.map((m) => `${m.size} x${m.quantity}`).join(', '),
        c.days.map((d) => DAY_LABELS_FULL[d as DayOfWeek]).join(', '),
        c.frequency,
        c.notes,
        c.isActive ? 'Да' : 'Нет',
      ]),
    }

    const driverSheet: SheetData = {
      name: 'Водители',
      header: ['Имя', 'Телефон', 'Рабочие дни', 'Активен'],
      rows: drivers.map((d) => [
        d.name,
        d.phone,
        d.workDays.map((day) => DAY_LABELS_FULL[day as DayOfWeek]).join(', '),
        d.isActive ? 'Да' : 'Нет',
      ]),
    }

    const clientMap = new Map(clients.map((c) => [c.id, c.name]))
    const driverMap = new Map(drivers.map((d) => [d.id, d.name]))

    const routeSheet: SheetData = {
      name: 'Маршруты',
      header: ['День', 'Позиция', 'Клиент', 'Водитель'],
      rows: routes.flatMap((route) =>
        route.stops.map((stop) => [
          DAY_LABELS_FULL[route.day as DayOfWeek],
          stop.position + 1,
          clientMap.get(stop.clientId) ?? stop.clientId,
          stop.driverId ? (driverMap.get(stop.driverId) ?? stop.driverId) : '',
        ]),
      ),
    }

    const matSizeSheet: SheetData = {
      name: 'Размеры ковриков',
      header: ['ID', 'Название', 'Площадь (м²)'],
      rows: matSizes.map((s) => [s.id, s.label, s.area]),
    }

    return [clientSheet, driverSheet, routeSheet, matSizeSheet]
  }, [clients, drivers, routes, matSizes])

  const getLocalData = useCallback((): LocalData => {
    const settings = useSettingsStore.getState()
    const changelog = useChangeLogStore.getState().entries
    const serviceLog = useServiceLogStore.getState().entries

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
  }, [matSizes, drivers, clients, routes])

  return (
    <div className="space-y-6">
      <DatabaseOverview stats={stats} sheets={sheets} />
      <MigrationPanel getLocalData={getLocalData} />
    </div>
  )
}
