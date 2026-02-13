import { ClientsTable, ClientForm } from '@/modules/clients'

export function ClientsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-50">Клиенты</h1>
        <ClientForm />
      </div>
      <ClientsTable />
    </div>
  )
}
