import { ClientsTable } from '@/modules/clients'

export function ClientsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-50">Клиенты</h1>
      <ClientsTable />
    </div>
  )
}
