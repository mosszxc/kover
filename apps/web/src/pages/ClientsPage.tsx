import { useCallback, useMemo, useState } from 'react'
import { ClientsTable, ClientForm, useClientStore, BatchGeocode } from '@/modules/clients'
import { useRouteStore } from '@/modules/routes'
import type { Client } from '@/modules/clients'
import type { DayOfWeek } from '@/shared/types'
import { generateId } from '@/shared/lib/generateId'

export function ClientsPage() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const deleteClient = useClientStore((s) => s.deleteClient)
  const updateClient = useClientStore((s) => s.updateClient)
  const removeClientFromAllRoutes = useRouteStore((s) => s.removeClientFromAllRoutes)
  const addStop = useRouteStore((s) => s.addStop)
  const routes = useRouteStore((s) => s.routes)

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
      const newIsActive = !client.isActive
      updateClient(client.id, { isActive: newIsActive })

      if (newIsActive) {
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
    },
    [updateClient, routes, addStop],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-50">Клиенты</h1>
        <div className="flex items-center gap-2">
          <BatchGeocode />
          <ClientForm />
        </div>
      </div>
      <ClientsTable onRowClick={setSelectedClient} isClientInRoute={isClientInRoute} onToggleActive={handleToggleActive} />
      {selectedClient && (
        <ClientForm
          client={selectedClient}
          open={!!selectedClient}
          onOpenChange={(open) => { if (!open) setSelectedClient(null) }}
          onDelete={(id) => {
            deleteClient(id)
            removeClientFromAllRoutes(id)
            setSelectedClient(null)
          }}
        />
      )}
    </div>
  )
}
