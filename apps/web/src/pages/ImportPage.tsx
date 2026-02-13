import { useClientStore } from '@/modules/clients'
import { useRouteStore } from '@/modules/routes'
import { JsonBackup } from '@/modules/import'
import type { Client } from '@/modules/clients'
import type { DayRoute } from '@/modules/routes'

export function ImportPage() {
  const clients = useClientStore((s) => s.clients)
  const routes = useRouteStore((s) => s.routes)
  const seedClients = useClientStore((s) => s.seedClients)
  const seedRoutes = useRouteStore((s) => s.seedRoutes)

  const handleRestore = (data: { clients: unknown[]; routes: unknown[] }) => {
    seedClients(data.clients as Client[])
    seedRoutes(data.routes as DayRoute[])
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-50">Импорт</h1>
      <JsonBackup data={{ clients, routes }} onRestore={handleRestore} />
    </div>
  )
}
