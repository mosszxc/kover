import { useState } from 'react'
import { ClientsTable, ClientForm, useClientStore } from '@/modules/clients'
import { useRouteStore } from '@/modules/routes'
import type { Client } from '@/modules/clients'

export function ClientsPage() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const deleteClient = useClientStore((s) => s.deleteClient)
  const removeClientFromAllRoutes = useRouteStore((s) => s.removeClientFromAllRoutes)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-50">Клиенты</h1>
        <ClientForm />
      </div>
      <ClientsTable onRowClick={setSelectedClient} />
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
