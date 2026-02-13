import { Minus, Plus, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { MAT_SIZE_OPTIONS } from '@/shared/constants'
import type { MatRow } from '../lib/formHelpers'

interface MatRowCardProps {
  mat: MatRow
  index: number
  canRemove: boolean
  onSizeChange: (size: string) => void
  onQuantityChange: (quantity: number) => void
  onColorChange: (color: string) => void
  onRemove: () => void
}

const baseInput =
  'h-11 rounded-md border border-slate-700 bg-slate-900 px-3 text-base text-slate-50 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors'

export function MatRowCard({
  mat,
  index,
  canRemove,
  onSizeChange,
  onQuantityChange,
  onColorChange,
  onRemove,
}: MatRowCardProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={mat.size}
          onChange={(e) => onSizeChange(e.target.value)}
          aria-label={`Размер коврика ${index + 1}`}
          className={`${baseInput} w-24 shrink-0 cursor-pointer`}
        >
          {MAT_SIZE_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <div className="flex shrink-0 items-center">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-r-none"
            disabled={mat.quantity <= 1}
            onClick={() => onQuantityChange(mat.quantity - 1)}
            aria-label={`Уменьшить количество коврика ${index + 1}`}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="flex h-9 w-10 items-center justify-center border-y border-slate-700 bg-slate-900 text-center tabular-nums text-base text-slate-50">
            {mat.quantity}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-l-none"
            disabled={mat.quantity >= 99}
            onClick={() => onQuantityChange(mat.quantity + 1)}
            aria-label={`Увеличить количество коврика ${index + 1}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-slate-500 hover:text-red-400"
          disabled={!canRemove}
          onClick={onRemove}
          aria-label={`Удалить коврик ${index + 1}`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <input
        type="text"
        value={mat.color}
        onChange={(e) => onColorChange(e.target.value)}
        placeholder="Цвет"
        aria-label={`Цвет коврика ${index + 1}`}
        className={`${baseInput} w-full`}
      />
    </div>
  )
}
