import { cn } from '@/shared/lib/utils'
import type { MatSpec } from '@/modules/clients'
import { MAT_AREA, type MatSize } from '@/shared/types'

const BLOCK_BG_COLORS = [
  'bg-blue-500/10',
  'bg-amber-500/10',
  'bg-emerald-500/10',
] as const

const BLOCK_TEXT_COLORS = [
  'text-blue-400',
  'text-amber-400',
  'text-emerald-400',
] as const

interface BlockDividerProps {
  name: string
  blockIndex: number
  stopCount: number
  mats: MatSpec[]
}

export function BlockDivider({ name, blockIndex, stopCount, mats }: BlockDividerProps) {
  const bgColor = BLOCK_BG_COLORS[blockIndex % BLOCK_BG_COLORS.length]
  const textColor = BLOCK_TEXT_COLORS[blockIndex % BLOCK_TEXT_COLORS.length]

  const matTotals = new Map<MatSize, number>()
  for (const mat of mats) {
    matTotals.set(mat.size, (matTotals.get(mat.size) ?? 0) + mat.quantity)
  }

  const totalArea = mats.reduce(
    (sum, m) => sum + m.quantity * (MAT_AREA[m.size] ?? 0),
    0,
  )

  return (
    <div className={cn('flex items-center justify-between rounded-md px-3 py-2', bgColor)}>
      <div className="flex items-center gap-2">
        <span className={cn('text-sm font-semibold', textColor)}>{name}</span>
        <span className="text-xs text-slate-500">
          {stopCount} {pluralStops(stopCount)}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          {[...matTotals.entries()].map(([size, qty]) => (
            <span
              key={size}
              className="rounded bg-slate-800/50 px-1.5 py-0.5 text-xs text-slate-400"
            >
              {size}: {qty}
            </span>
          ))}
        </div>
        <span className="text-sm font-semibold tabular-nums text-slate-300">
          {totalArea.toFixed(1)} м²
        </span>
      </div>
    </div>
  )
}

function pluralStops(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return 'точек'
  if (mod10 === 1) return 'точка'
  if (mod10 >= 2 && mod10 <= 4) return 'точки'
  return 'точек'
}
