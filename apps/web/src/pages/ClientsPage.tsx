import { useCallback, useMemo, useState } from 'react'
import { ClientsTable, ClientForm, useClientStore } from '@/modules/clients'
import { useRouteStore } from '@/modules/routes'
import type { Client } from '@/modules/clients'
import type { DayOfWeek } from '@/shared/types'

export function ClientsPage() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const deleteClient = useClientStore((s) => s.deleteClient)
  const removeClientFromAllRoutes = useRouteStore((s) => s.removeClientFromAllRoutes)
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-50">Клиенты</h1>
        <ClientForm />
      </div>
      <ClientsTable onRowClick={setSelectedClient} isClientInRoute={isClientInRoute} />
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
