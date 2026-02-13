import { useMemo } from 'react'
import { Check, ChevronUp, ChevronDown, GripVertical, TriangleAlert } from 'lucide-react'
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
import type { Client, MatSpec } from '@/modules/clients'
import { MAT_AREA } from '@/shared/types'
import { MAT_SIZE_STYLES } from '../constants/matStyles'
import { useRouteStore } from '../store'
import { RemoveStopDialog } from './RemoveStopDialog'
import { TransferStopDialog } from './TransferStopDialog'

export interface DriverOption {
  id: string
  name: string
}

interface StopCardProps {
  number: number
  client: Client
  stopId: string
  isCompleted: boolean
  driverId?: string
  drivers: DriverOption[]
  stopIndex: number
  isFirst: boolean
  isLast: boolean
  isDndEnabled?: boolean
  isAnomaly?: boolean
}

function matArea(mats: MatSpec[]): number {
  return mats.reduce((sum, m) => sum + m.quantity * (MAT_AREA[m.size] ?? 0), 0)
}

export function StopCard({ number, client, stopId, isCompleted, driverId, drivers, stopIndex, isFirst, isLast, isDndEnabled = true, isAnomaly = false }: StopCardProps) {
  const area = matArea(client.mats)
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const toggleStopCompleted = useRouteStore((s) => s.toggleStopCompleted)
  const assignDriver = useRouteStore((s) => s.assignDriver)
  const moveStop = useRouteStore((s) => s.moveStop)

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

  const prefersReducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: prefersReducedMotion ? 'none' : transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 border-l-3 p-3 transition-colors hover:bg-slate-800',
        isAnomaly
          ? 'border-l-amber-500 bg-amber-500/5'
          : driverId
            ? 'border-l-blue-500'
            : 'border-l-slate-700',
        isCompleted && 'opacity-60',
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
          className="flex size-6 shrink-0 cursor-grab items-center justify-center rounded transition-colors hover:bg-slate-700 active:cursor-grabbing print:hidden"
        >
          <GripVertical className="size-5 text-slate-400" />
        </button>
      )}

      <button
        type="button"
        aria-label={isCompleted ? 'Отметить как невыполненное' : 'Отметить как выполненное'}
        onClick={() => toggleStopCompleted(selectedDay, stopId)}
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded border transition-colors print:hidden',
          isCompleted
            ? 'border-green-500 bg-green-500 text-white'
            : 'border-slate-600 bg-transparent hover:border-slate-400',
        )}
      >
        {isCompleted && <Check className="size-4" />}
      </button>

      <div className="flex shrink-0 flex-col">
        {!isFirst ? (
          <button
            type="button"
            aria-label="Переместить вверх"
            onClick={() => moveStop(selectedDay, stopId, stopIndex - 1)}
            className="flex size-6 items-center justify-center rounded transition-colors hover:bg-slate-700"
          >
            <ChevronUp className="size-5 text-slate-400" />
          </button>
        ) : (
          <div className="size-6" />
        )}
        {!isLast ? (
          <button
            type="button"
            aria-label="Переместить вниз"
            onClick={() => moveStop(selectedDay, stopId, stopIndex + 1)}
            className="flex size-6 items-center justify-center rounded transition-colors hover:bg-slate-700"
          >
            <ChevronDown className="size-5 text-slate-400" />
          </button>
        ) : (
          <div className="size-6" />
        )}
      </div>

      <span className="w-8 shrink-0 text-center text-sm tabular-nums text-slate-500">
        {number}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {isAnomaly && (
            <span title="Далеко от остальных остановок" className="shrink-0 print:hidden">
              <TriangleAlert className="size-4 text-amber-400" aria-label="Далеко от остальных остановок" />
            </span>
          )}
          <p className={cn(
            'truncate text-base text-slate-50',
            isCompleted && 'line-through',
          )}>
            {client.originalName}
          </p>
        </div>
      </div>

      {drivers.length > 0 && (
        <Select
          value={driverId ?? '__none__'}
          onValueChange={(value) => assignDriver(selectedDay, stopId, value === '__none__' ? null : value)}
        >
          <SelectTrigger
            size="sm"
            aria-label="Назначить водителя"
            className={cn(
              'w-34 shrink-0 cursor-pointer truncate text-xs print:hidden',
              driverId
                ? 'border-blue-600/50 bg-blue-950/50 text-blue-300'
                : 'border-slate-700 bg-slate-900 text-slate-500',
            )}
          >
            <SelectValue placeholder="Водитель" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Без водителя</SelectItem>
            {drivers.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex shrink-0 items-center gap-1.5">
        {client.mats.map((mat, i) => (
          <span
            key={i}
            className={`rounded px-1.5 py-0.5 text-xs font-semibold ${MAT_SIZE_STYLES[mat.size].badge}`}
          >
            {mat.size}
            {mat.quantity > 1 && <span className="opacity-60"> x{mat.quantity}</span>}
          </span>
        ))}
      </div>

      <span className="w-16 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-300">
        {area.toFixed(1)} м²
      </span>

      <TransferStopDialog
        stopId={stopId}
        clientName={client.originalName}
        day={selectedDay}
      />

      <RemoveStopDialog
        stopId={stopId}
        clientName={client.originalName}
        day={selectedDay}
      />
    </div>
  )
}
