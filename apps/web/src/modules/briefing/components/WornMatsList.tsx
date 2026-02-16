import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '@/shared/lib/utils'
import type { WornMat } from '../types'

interface WornMatsListProps {
  mats: WornMat[]
}

export function WornMatsList({ mats }: WornMatsListProps) {
  if (mats.length === 0) return null

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-foreground">
            Износ ковриков
          </h2>
        </div>
        <Link
          to="/inventory"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Инвентарь
        </Link>
      </div>

      <div className="space-y-2">
        {mats.map((mat) => (
          <div key={mat.sizeId} className="flex items-center gap-3">
            <span className="w-16 text-sm font-medium text-foreground">
              {mat.sizeLabel}
            </span>
            <div className="flex-1">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    mat.wearPercent >= 100
                      ? 'bg-red-500'
                      : 'bg-amber-500',
                  )}
                  style={{ width: `${Math.min(mat.wearPercent, 100)}%` }}
                />
              </div>
            </div>
            <span
              className={cn(
                'text-sm font-medium w-12 text-right',
                mat.wearPercent >= 100 ? 'text-red-400' : 'text-amber-400',
              )}
            >
              {mat.wearPercent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
