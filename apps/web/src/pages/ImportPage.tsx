import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useClientStore } from '@/modules/clients'
import { useRouteStore } from '@/modules/routes'
import { JsonBackup, ExcelUpload, ImportPreview } from '@/modules/import'
import type { ParsedClient } from '@/modules/import'
import type { Client } from '@/modules/clients'
import type { DayRoute, RouteStop } from '@/modules/routes'
import type { DayOfWeek } from '@/shared/types'
import { FileSyncStatus } from '@/shared/components/FileSyncStatus'

interface ParsedData {
  clients: ParsedClient[]
  routesByDay: Record<DayOfWeek, string[]>
}

function matchRouteEntry(
  entry: string,
  clients: Client[],
): string | undefined {
  const norm = entry.toLowerCase().trim()
  return (
    clients.find((c) => c.name.toLowerCase() === norm)?.id ??
    clients.find((c) => c.originalName.toLowerCase().includes(norm))?.id ??
    clients.find(
      (c) =>
        c.name.toLowerCase().startsWith(norm) ||
        norm.startsWith(c.name.toLowerCase()),
    )?.id
  )
}

function buildClients(parsed: ParsedClient[], routesByDay: Record<DayOfWeek, string[]>): Client[] {
  return parsed.map((pc) => {
    const id = crypto.randomUUID()
    const days = (Object.entries(routesByDay) as [string, string[]][])
      .filter(([, stops]) =>
        stops.some((s) => {
          const n = s.toLowerCase().trim()
          return (
            pc.name.toLowerCase() === n ||
            pc.originalName.toLowerCase().includes(n) ||
            pc.name.toLowerCase().startsWith(n) ||
            n.startsWith(pc.name.toLowerCase())
          )
        }),
      )
      .map(([day]) => Number(day) as DayOfWeek)

    return {
      id,
      originalName: pc.originalName,
      name: pc.name,
      address: pc.address,
      mats: pc.mats,
      frequency: days.length,
      days,
      notes: pc.notes,
      isActive: true,
      createdAt: new Date().toISOString(),
    }
  })
}

function buildRoutes(clients: Client[], routesByDay: Record<DayOfWeek, string[]>): DayRoute[] {
  return (Object.entries(routesByDay) as [string, string[]][]).map(
    ([day, entries]) => {
      const stops: RouteStop[] = []
      entries.forEach((entry, idx) => {
        const clientId = matchRouteEntry(entry, clients)
        if (clientId) {
          stops.push({
            id: crypto.randomUUID(),
            clientId,
            position: idx,
            isCompleted: false,
          })
        }
      })
      return { day: Number(day) as DayOfWeek, stops }
    },
  )
}

export function ImportPage() {
  const [parsed, setParsed] = useState<ParsedData | null>(null)
  const navigate = useNavigate()

  const clients = useClientStore((s) => s.clients)
  const routes = useRouteStore((s) => s.routes)
  const seedClients = useClientStore((s) => s.seedClients)
  const seedRoutes = useRouteStore((s) => s.seedRoutes)

  const handleRestore = (data: { clients: unknown[]; routes: unknown[] }) => {
    seedClients(data.clients as Client[])
    seedRoutes(data.routes as DayRoute[])
  }

  const handleConfirm = (editedClients: ParsedClient[]) => {
    if (!parsed) return
    const newClients = buildClients(editedClients, parsed.routesByDay)
    const newRoutes = buildRoutes(newClients, parsed.routesByDay)
    seedClients(newClients)
    seedRoutes(newRoutes)
    toast.success(`Импортировано ${newClients.length} клиентов`)
    navigate('/clients')
  }

  if (parsed) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Сверка импорта</h1>
        <ImportPreview
          clients={parsed.clients}
          onConfirm={handleConfirm}
          onCancel={() => setParsed(null)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Импорт</h1>
      <ExcelUpload onParsed={setParsed} />
      <JsonBackup data={{ clients, routes }} onRestore={handleRestore} />

      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Автосохранение на диск</h2>
        <FileSyncStatus />
      </div>
    </div>
  )
}
