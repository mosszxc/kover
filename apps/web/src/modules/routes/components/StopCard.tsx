import { Check, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { Client, MatSpec } from '@/modules/clients'
import { MAT_AREA } from '@/shared/types'
import { useRouteStore } from '../store'

interface StopCardProps {
  number: number
  client: Client
  stopId: string
  isCompleted: boolean
  stopIndex: number
  isFirst: boolean
  isLast: boolean
}

function matArea(mats: MatSpec[]): number {
  return mats.reduce((sum, m) => sum + m.quantity * (MAT_AREA[m.size] ?? 0), 0)
}

export function StopCard({ number, client, stopId, isCompleted, stopIndex, isFirst, isLast }: StopCardProps) {
  const area = matArea(client.mats)
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const toggleStopCompleted = useRouteStore((s) => s.toggleStopCompleted)
  const moveStop = useRouteStore((s) => s.moveStop)

  return (
    <div
      className={cn(
        'flex items-center gap-3 border-l-3 border-l-slate-700 p-3 transition-colors hover:bg-slate-800',
        isCompleted && 'opacity-60',
      )}
    >
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
        <p className={cn(
          'truncate text-base text-slate-50',
          isCompleted && 'line-through',
        )}>
          {client.originalName}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {client.mats.map((mat, i) => (
          <span
            key={i}
            className="rounded bg-slate-800 px-1.5 py-0.5 text-xs font-semibold text-slate-300"
          >
            {mat.size}
            {mat.quantity > 1 && <span className="text-slate-500"> x{mat.quantity}</span>}
          </span>
        ))}
      </div>

      <span className="w-16 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-300">
        {area.toFixed(1)} м²
      </span>
    </div>
  )
}
