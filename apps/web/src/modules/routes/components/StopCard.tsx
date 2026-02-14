import { ChevronUp, ChevronDown, GripVertical, MapPinOff, Pencil, TriangleAlert, Clock, MoreHorizontal, ArrowRightLeft, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/shared/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import type { Client } from '@/modules/clients'
import { getClientReplacements, formatWorkingHours } from '@/modules/clients'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import { useMemo, useState } from 'react'
import { useRouteStore } from '../store'
import { RemoveStopDialog } from './RemoveStopDialog'
import { TransferStopDialog } from './TransferStopDialog'

import type { DayOfWeek } from '@/shared/types'
import {
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '@/shared/ui/select'

export interface DriverOption {
  id: string
  name: string
  workDays: DayOfWeek[]
}

interface StopCardProps {
  number: number
  client: Client
  stopId: string
  driverId?: string
  drivers: DriverOption[]
  stopIndex: number
  isFirst: boolean
  isLast: boolean
  isDndEnabled?: boolean
  isAnomaly?: boolean
  isMissingCoords?: boolean
  onEditClient?: (client: Client) => void
}

export function StopCard({ number, client, stopId, driverId, drivers, stopIndex, isFirst, isLast, isDndEnabled = true, isAnomaly = false, isMissingCoords = false, onEditClient }: StopCardProps) {
  const sizes = useMatSizeStore((s) => s.sizes)
  const areaMap = Object.fromEntries(sizes.map((s) => [s.id, s.area]))
  const labelMap = Object.fromEntries(sizes.map((s) => [s.id, s.label]))
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const replacements = getClientReplacements(client, selectedDay)
  const area = client.mats.reduce((sum, m) => sum + m.quantity * (areaMap[m.size] ?? 0), 0) * replacements
  const assignDriver = useRouteStore((s) => s.assignDriver)
  const moveStop = useRouteStore((s) => s.moveStop)

  const [removeOpen, setRemoveOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: stopId,
    disabled: !isDndEnabled,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
  }

  const driverName = drivers.find((d) => d.id === driverId)?.name

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-3 border-l-3 p-3 transition-colors hover:bg-accent',
        isAnomaly
          ? 'border-l-amber-500 bg-amber-500/5'
          : isMissingCoords
            ? 'border-l-slate-500 bg-slate-500/5'
            : driverId
              ? 'border-l-blue-500'
              : 'border-l-border',
        isDragging && 'z-10 opacity-50 ring-2 ring-blue-500',
      )}
      {...attributes}
    >
      {isDndEnabled && (
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...listeners}
          aria-label="Перетащить для изменения порядка"
          className="flex size-6 shrink-0 cursor-grab items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 print:hidden"
        >
          <GripVertical className="size-5 text-muted-foreground" />
        </button>
      )}

      <span className="w-8 shrink-0 text-center text-sm tabular-nums text-muted-foreground">
        {number}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {isMissingCoords && (
            <span title="Нет координат — не отображается на карте" className="shrink-0 print:hidden">
              <MapPinOff className="size-4 text-slate-400" aria-label="Нет координат" />
            </span>
          )}
          {isAnomaly && (
            <span title="Далеко от остальных остановок" className="shrink-0 print:hidden">
              <TriangleAlert className="size-4 text-amber-400" aria-label="Далеко от остальных остановок" />
            </span>
          )}
          <p className="truncate lg:whitespace-normal text-base text-foreground">
            {client.originalName}
          </p>
          {formatWorkingHours(client) && (
            <span className="ml-1 inline-flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {formatWorkingHours(client)}
            </span>
          )}
        </div>
        {isAnomaly && onEditClient && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEditClient(client)
            }}
            className="mt-1 h-auto gap-1 px-1.5 py-0.5 text-xs text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 print:hidden"
          >
            <Pencil className="size-3" />
            Исправить адрес
          </Button>
        )}
      </div>

      {drivers.length > 0 && (
        <DriverSelect
          drivers={drivers}
          selectedDay={selectedDay}
          driverId={driverId}
          onValueChange={(value) => assignDriver(selectedDay, stopId, value === '__none__' ? null : value)}
        />
      )}

      <div className="flex shrink-0 items-center gap-1.5">
        {replacements > 1 && (
          <span className="rounded bg-blue-600/20 px-1.5 py-0.5 text-xs font-semibold text-blue-400">
            {replacements}×
          </span>
        )}
        {client.mats.map((mat, i) => (
          <span
            key={i}
            className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-foreground"
          >
            {labelMap[mat.size] ?? mat.size}
            {mat.quantity > 1 && <span className="opacity-60"> x{mat.quantity}</span>}
          </span>
        ))}
      </div>

      <span className="w-16 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
        {area.toFixed(1)} м²
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Действия с остановкой"
            className="flex size-6 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 print:hidden"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isFirst && (
            <DropdownMenuItem onClick={() => moveStop(selectedDay, stopId, stopIndex - 1)}>
              <ChevronUp className="size-4" />
              Переместить вверх
            </DropdownMenuItem>
          )}
          {!isLast && (
            <DropdownMenuItem onClick={() => moveStop(selectedDay, stopId, stopIndex + 1)}>
              <ChevronDown className="size-4" />
              Переместить вниз
            </DropdownMenuItem>
          )}
          {(!isFirst || !isLast) && <DropdownMenuSeparator />}
          <DropdownMenuItem onClick={() => setTransferOpen(true)}>
            <ArrowRightLeft className="size-4" />
            Перенести в другой день
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setRemoveOpen(true)}>
            <X className="size-4" />
            Убрать из маршрута
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TransferStopDialog
        stopId={stopId}
        clientId={client.id}
        clientName={client.originalName}
        day={selectedDay}
        driverName={driverName}
        open={transferOpen}
        onOpenChange={setTransferOpen}
      />

      <RemoveStopDialog
        stopId={stopId}
        clientId={client.id}
        clientName={client.originalName}
        day={selectedDay}
        driverName={driverName}
        open={removeOpen}
        onOpenChange={setRemoveOpen}
      />
    </div>
  )
}

interface DriverSelectProps {
  drivers: DriverOption[]
  selectedDay: DayOfWeek
  driverId?: string
  onValueChange: (value: string) => void
}

function DriverSelect({ drivers, selectedDay, driverId, onValueChange }: DriverSelectProps) {
  const { working, notWorking } = useMemo(() => {
    const w: DriverOption[] = []
    const nw: DriverOption[] = []
    for (const d of drivers) {
      if (d.workDays.includes(selectedDay)) {
        w.push(d)
      } else {
        nw.push(d)
      }
    }
    return { working: w, notWorking: nw }
  }, [drivers, selectedDay])

  return (
    <Select value={driverId ?? '__none__'} onValueChange={onValueChange}>
      <SelectTrigger
        size="sm"
        aria-label="Назначить водителя"
        className={cn(
          'w-34 shrink-0 cursor-pointer truncate text-xs print:hidden',
          driverId
            ? 'border-blue-600/50 bg-blue-950/50 text-blue-300'
            : 'border-border bg-card text-muted-foreground',
        )}
      >
        <SelectValue placeholder="Водитель" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">Без водителя</SelectItem>
        {working.map((d) => (
          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
        ))}
        {notWorking.length > 0 && (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel className="text-xs text-muted-foreground">Не работают сегодня</SelectLabel>
              {notWorking.map((d) => (
                <SelectItem key={d.id} value={d.id} className="text-muted-foreground">
                  {d.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </>
        )}
      </SelectContent>
    </Select>
  )
}
