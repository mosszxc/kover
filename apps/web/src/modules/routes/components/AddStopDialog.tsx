import { useState, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { useRouteStore } from '../store'
import type { RouteStop } from '../types'

interface Client {
  id: string
  originalName: string
  name: string
  address: string
}

interface AddStopDialogProps {
  clients: Client[]
}

export function AddStopDialog({ clients }: AddStopDialogProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [position, setPosition] = useState<number>(-1) // -1 = в конец

  const routes = useRouteStore((s) => s.routes)
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const addStop = useRouteStore((s) => s.addStop)
  const moveStop = useRouteStore((s) => s.moveStop)

  const dayRoute = routes.find((r) => r.day === selectedDay)
  const stops = dayRoute?.stops ?? []

  const currentClientIds = useMemo(() => {
    if (!dayRoute) return new Set<string>()
    const ids = new Set<string>()
    for (const s of dayRoute.stops) {
      ids.add(s.clientId)
    }
    return ids
  }, [dayRoute])

  const query = search.toLowerCase()

  const availableClients = useMemo(
    () =>
      clients.filter((c) => {
        if (currentClientIds.has(c.id)) return false
        if (!query) return true
        return (
          c.originalName.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query) ||
          c.address.toLowerCase().includes(query)
        )
      }),
    [clients, currentClientIds, query],
  )

  function handleSelect(client: Client) {
    const stopId = crypto.randomUUID()
    const newStop: RouteStop = {
      id: stopId,
      clientId: client.id,
      position: position === -1 ? stops.length : position,
      isCompleted: false,
    }

    addStop(selectedDay, newStop)

    if (position !== -1) {
      moveStop(selectedDay, stopId, position)
    }

    setOpen(false)
    setSearch('')
    setPosition(-1)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSearch(''); setPosition(-1) } }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-dashed print:hidden"
        >
          <Plus className="h-4 w-4" />
          Добавить точку
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Добавить точку</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени или адресу..."
              className="h-11 w-full rounded-md border border-slate-700 bg-slate-900 pl-9 pr-3 text-sm text-slate-50 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none"
            />
          </div>

          {stops.length > 0 && (
            <select
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
              className="h-11 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-50 focus:border-slate-500 focus:outline-none"
            >
              <option value={-1}>В конец</option>
              {stops.map((_stop, i) => (
                <option key={i} value={i + 1}>
                  После точки №{i + 1}
                </option>
              ))}
            </select>
          )}

          <div className="-mx-6 max-h-[300px] overflow-y-auto">
            {availableClients.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                {query ? 'Ничего не найдено' : 'Все клиенты уже в маршруте'}
              </div>
            ) : (
              availableClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => handleSelect(client)}
                  className="flex min-h-11 w-full flex-col gap-0.5 px-6 py-2.5 text-left transition-colors hover:bg-slate-800"
                >
                  <span className="text-sm text-slate-50">{client.originalName}</span>
                  <span className="text-xs text-slate-500">{client.address}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
