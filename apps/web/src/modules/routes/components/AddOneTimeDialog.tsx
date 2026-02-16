import { useState, useMemo } from 'react'
import { CalendarPlus, Search } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import type { DayOfWeek } from '@/shared/types'
import { useRouteExceptionsStore } from '@/shared/stores/routeExceptionsStore'
import { useServiceLogStore } from '@/shared/stores/serviceLogStore'
import { useRouteStore } from '../store'

interface Client {
  id: string
  originalName: string
  name: string
  address: string
  isActive: boolean
  pausedUntil?: string | null
}

interface AddOneTimeDialogProps {
  clients: Client[]
}

function formatDateRu(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' })
}

export function AddOneTimeDialog({ clients }: AddOneTimeDialogProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')

  const selectedDay = useRouteStore((s) => s.selectedDay)
  const routes = useRouteStore((s) => s.routes)
  const addException = useRouteExceptionsStore((s) => s.addException)
  const addServiceLog = useServiceLogStore((s) => s.addEntry)

  const dayRoute = routes.find((r) => r.day === selectedDay)

  const currentClientIds = useMemo(() => {
    const ids = new Set<string>()
    if (dayRoute) {
      for (const s of dayRoute.stops) {
        ids.add(s.clientId)
      }
    }
    return ids
  }, [dayRoute])

  const query = search.toLowerCase()

  // Show clients NOT in today's route template
  const availableClients = useMemo(
    () =>
      clients.filter((c) => {
        if (!c.isActive) return false
        if (c.pausedUntil && c.pausedUntil > new Date().toISOString().slice(0, 10)) return false
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

  function handleAdd() {
    if (!selectedClient || !date) return
    // Determine which DayOfWeek the selected date falls on
    const d = new Date(date + 'T00:00:00')
    const jsDay = d.getDay() // 0=Sun..6=Sat
    const dayOfWeek = (jsDay === 0 ? 6 : jsDay - 1) as DayOfWeek // Convert to 0=Mon..6=Sun

    addException({
      clientId: selectedClient.id,
      date,
      type: 'add',
      day: dayOfWeek,
      reason: reason || undefined,
    })
    addServiceLog({
      clientId: selectedClient.id,
      day: dayOfWeek,
      type: 'schedule_changed',
      details: `Разовый визит на ${formatDateRu(date)}${reason ? `: ${reason}` : ''}`,
    })
    resetAndClose()
  }

  function resetAndClose() {
    setOpen(false)
    setSearch('')
    setSelectedClient(null)
    setDate('')
    setReason('')
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="no-print gap-1.5"
        >
          <CalendarPlus className="size-4" />
          Разовый визит
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Добавить разовый визит</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {!selectedClient ? (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск клиента..."
                  className="h-11 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                />
              </div>
              <div className="-mx-6 max-h-[300px] overflow-y-auto">
                {availableClients.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {query ? 'Ничего не найдено' : 'Все клиенты уже в маршруте'}
                  </div>
                ) : (
                  availableClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => setSelectedClient(client)}
                      className="flex min-h-11 w-full flex-col gap-0.5 px-6 py-2.5 text-left transition-colors hover:bg-accent"
                    >
                      <span className="text-sm text-foreground">{client.originalName}</span>
                      <span className="text-xs text-muted-foreground">{client.address}</span>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <div className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{selectedClient.originalName}</p>
                <p className="text-xs text-muted-foreground">{selectedClient.address}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-auto px-0 py-0 text-xs text-blue-400"
                  onClick={() => setSelectedClient(null)}
                >
                  Выбрать другого
                </Button>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="onetime-date" className="text-sm text-muted-foreground">
                  Дата визита:
                </label>
                <input
                  id="onetime-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                />
                {date && (
                  <p className="text-xs text-muted-foreground">{formatDateRu(date)}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="onetime-reason" className="text-sm text-muted-foreground">
                  Причина (необязательно):
                </label>
                <input
                  id="onetime-reason"
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Замена, доп. визит..."
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                />
              </div>
            </>
          )}
        </div>

        {selectedClient && (
          <DialogFooter>
            <Button variant="ghost" onClick={resetAndClose}>Отмена</Button>
            <Button disabled={!date} onClick={handleAdd}>
              Добавить визит
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
