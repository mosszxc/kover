import { UserCheck } from 'lucide-react'
import { Link } from 'react-router'
import type { Client } from '@/modules/clients'

interface ReturningClientsProps {
  clients: Client[]
}

export function ReturningClients({ clients }: ReturningClientsProps) {
  if (clients.length === 0) return null

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <UserCheck className="size-5 text-emerald-400" />
        <h2 className="text-lg font-semibold text-foreground">
          Возвращаются с паузы
        </h2>
      </div>

      <ul className="space-y-1">
        {clients.map((client) => (
          <li key={client.id} className="flex items-center justify-between text-sm">
            <span className="text-foreground">{client.name}</span>
            <Link
              to="/clients"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Карточка
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
