import { cn } from '@/shared/lib/utils'
import type { Client, MatSpec } from '@/modules/clients'
import { MAT_AREA } from '@/shared/types'

const BLOCK_BORDER_COLORS = [
  'border-l-blue-500',
  'border-l-amber-500',
  'border-l-emerald-500',
] as const

interface StopCardProps {
  number: number
  client: Client
  blockIndex: number
}

function matArea(mats: MatSpec[]): number {
  return mats.reduce((sum, m) => sum + m.quantity * (MAT_AREA[m.size] ?? 0), 0)
}

export function StopCard({ number, client, blockIndex }: StopCardProps) {
  const borderColor = BLOCK_BORDER_COLORS[blockIndex % BLOCK_BORDER_COLORS.length]
  const area = matArea(client.mats)

  return (
    <div
      className={cn(
        'flex items-center gap-3 border-l-3 p-3 transition-colors hover:bg-slate-800',
        borderColor,
      )}
    >
      <span className="w-8 shrink-0 text-center text-sm tabular-nums text-slate-500">
        {number}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base text-slate-50">{client.originalName}</p>
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
