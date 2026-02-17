import { UserCheck, ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/shared/ui/button'
import type { Client } from '@/modules/clients'

interface ReturningClientsProps {
  clients: Client[]
}

export function ReturningClients({ clients }: ReturningClientsProps) {
  if (clients.length === 0) return null

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="size-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-foreground">
            Возвращаются с паузы
          </h2>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/clients">
            Клиенты
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>

      <ul className="space-y-1">
        {clients.map((client) => (
          <li key={client.id} className="flex items-center justify-between text-sm">
            <span className="text-foreground">{client.name}</span>
            <Button variant="link" size="sm" asChild className="h-auto p-0">
              <Link to="/clients">
                Проверить
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
