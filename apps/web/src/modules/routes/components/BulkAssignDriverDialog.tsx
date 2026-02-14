import { useState, useMemo } from 'react'
import { Users } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { cn } from '@/shared/lib/utils'
import { useRouteStore } from '../store'
import type { DriverOption } from './StopCard'

type Scope = 'all' | 'unassigned' | 'filter'

interface BulkAssignDriverDialogProps {
  drivers: DriverOption[]
  driverFilter: string | 'unassigned' | null
}

export function BulkAssignDriverDialog({ drivers, driverFilter }: BulkAssignDriverDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null)
  const [scope, setScope] = useState<Scope>('unassigned')

  const selectedDay = useRouteStore((s) => s.selectedDay)
  const routes = useRouteStore((s) => s.routes)
  const assignDriverBulk = useRouteStore((s) => s.assignDriverBulk)

  const dayRoute = routes.find((r) => r.day === selectedDay)
  const stops = dayRoute?.stops ?? []

  const scopeStopIds = useMemo(() => {
    if (scope === 'all') return stops.map((s) => s.id)
    if (scope === 'unassigned') return stops.filter((s) => !s.driverId).map((s) => s.id)
    // 'filter' — use current driverFilter
    if (!driverFilter) return stops.map((s) => s.id)
    if (driverFilter === 'unassigned') return stops.filter((s) => !s.driverId).map((s) => s.id)
    return stops.filter((s) => s.driverId === driverFilter).map((s) => s.id)
  }, [stops, scope, driverFilter])

  const filterDriverName = useMemo(() => {
    if (!driverFilter || driverFilter === 'unassigned') return null
    return drivers.find((d) => d.id === driverFilter)?.name ?? null
  }, [driverFilter, drivers])

  const showFilterOption = driverFilter !== null

  function handleAssign() {
    if (!selectedDriverId || scopeStopIds.length === 0) return
    assignDriverBulk(selectedDay, scopeStopIds, selectedDriverId)
    setOpen(false)
    reset()
  }

  function reset() {
    setSelectedDriverId(null)
    setScope('unassigned')
  }

  if (drivers.length === 0) return null

  const scopeBtn = (value: Scope, label: string, count: number) => (
    <button
      type="button"
      onClick={() => setScope(value)}
      className={cn(
        'rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        scope === value
          ? 'border-blue-500 bg-blue-500/20 text-blue-400'
          : 'border-border text-foreground hover:border-ring',
      )}
    >
      {label} ({count})
    </button>
  )

  const allCount = stops.length
  const unassignedCount = stops.filter((s) => !s.driverId).length
  const filterCount = showFilterOption
    ? driverFilter === 'unassigned'
      ? unassignedCount
      : stops.filter((s) => s.driverId === driverFilter).length
    : 0

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <Users className="size-4" />
        Назначить водителя
      </Button>

      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Назначить водителя</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Водитель</p>
            <Select
              value={selectedDriverId ?? ''}
              onValueChange={setSelectedDriverId}
            >
              <SelectTrigger className="h-11 w-full border-border bg-card text-sm text-foreground">
                <SelectValue placeholder="Выберите водителя" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Какие остановки</p>
            <div className="flex flex-wrap gap-2">
              {scopeBtn('all', 'Все', allCount)}
              {scopeBtn('unassigned', 'Нераспределённые', unassignedCount)}
              {showFilterOption && (
                scopeBtn(
                  'filter',
                  filterDriverName
                    ? `Фильтр: ${filterDriverName}`
                    : 'Текущий фильтр',
                  filterCount,
                )
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setOpen(false); reset() }}>
              Отмена
            </Button>
            <Button
              disabled={!selectedDriverId || scopeStopIds.length === 0}
              onClick={handleAssign}
            >
              Назначить ({scopeStopIds.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
