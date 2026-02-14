import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClientsTable, EditClientDialog, AddClientDialog, useClientStore, BatchGeocode, GeocodeSettings, isClientPaused } from '@/modules/clients'
import { useRouteStore } from '@/modules/routes'
import type { Client } from '@/modules/clients'
import type { DayOfWeek } from '@/shared/types'
import { generateId } from '@/shared/lib/generateId'
import { detectGeoAnomalies } from '@/shared/lib/geoAnomalies'
import { useServiceLogStore } from '@/shared/stores/serviceLogStore'

export function ClientsPage() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const clients = useClientStore((s) => s.clients)
  const deleteClient = useClientStore((s) => s.deleteClient)
  const updateClient = useClientStore((s) => s.updateClient)
  const addStop = useRouteStore((s) => s.addStop)
  const routes = useRouteStore((s) => s.routes)
  const addServiceLog = useServiceLogStore((s) => s.addEntry)

  const activeClients = useMemo(() => clients.filter((c) => !isClientPaused(c)), [clients])
  const anomalyIds = useMemo(() => detectGeoAnomalies(activeClients), [activeClients])

  // Авто-реактивация клиентов с истёкшей паузой
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const expired = clients.filter((c) => c.pausedUntil && c.pausedUntil <= today && !c.isActive)
    for (const client of expired) {
      updateClient(client.id, { isActive: true, pausedUntil: null })
      // Добавляем обратно в маршруты
      for (const day of client.days) {
        const route = routes.find((r) => r.day === day)
        const alreadyInRoute = route?.stops.some((s) => s.clientId === client.id)
        if (!alreadyInRoute) {
          addStop(day, {
            id: generateId(),
            clientId: client.id,
            position: route?.stops.length ?? 0,
            isCompleted: false,
          })
        }
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

  const routeClientSet = useMemo(() => {
    const set = new Set<string>()
    for (const route of routes) {
      for (const stop of route.stops) {
        set.add(`${stop.clientId}-${route.day}`)
      }
    }
    return set
  }, [routes])

  const isClientInRoute = useCallback(
    (clientId: string, day: DayOfWeek) => routeClientSet.has(`${clientId}-${day}`),
    [routeClientSet],
  )

  const handleToggleActive = useCallback(
    (client: Client) => {
      // Вызывается при активации (из паузы)
      updateClient(client.id, { isActive: true, pausedUntil: null })

      for (const day of client.days) {
        addServiceLog({ clientId: client.id, day, type: 'unpaused' })
      }

      for (const day of client.days) {
        const route = routes.find((r) => r.day === day)
        const alreadyInRoute = route?.stops.some((s) => s.clientId === client.id)
        if (!alreadyInRoute) {
          addStop(day, {
            id: generateId(),
            clientId: client.id,
            position: route?.stops.length ?? 0,
            isCompleted: false,
          })
        }
      }
    },
    [updateClient, routes, addStop, addServiceLog],
  )

  const handlePauseClient = useCallback(
    (client: Client, pausedUntil: string | null) => {
      updateClient(client.id, { isActive: false, pausedUntil })
      for (const day of client.days) {
        addServiceLog({ clientId: client.id, day, type: 'paused' })
      }
    },
    [updateClient, addServiceLog],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Клиенты</h1>
        <div className="flex items-center gap-2">
          <GeocodeSettings />
          <BatchGeocode />
          <AddClientDialog />
        </div>
      </div>
      <ClientsTable onRowClick={setSelectedClient} isClientInRoute={isClientInRoute} onToggleActive={handleToggleActive} onPauseClient={handlePauseClient} anomalyIds={anomalyIds} />
      {selectedClient && (
        <EditClientDialog
          client={selectedClient}
          open={!!selectedClient}
          onOpenChange={(open) => { if (!open) setSelectedClient(null) }}
          onDelete={(id) => {
            deleteClient(id)
            setSelectedClient(null)
          }}
        />
      )}
    </div>
  )
}
