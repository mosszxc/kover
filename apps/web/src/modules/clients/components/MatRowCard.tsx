import { useState, useRef } from 'react'
import { Minus, Plus, X, Check } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import type { MatRow } from '../lib/formHelpers'

const CUSTOM_VALUE = '__custom__'

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
  'h-11 rounded-md border border-border bg-card px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors'

export function MatRowCard({
  mat,
  index,
  canRemove,
  onSizeChange,
  onQuantityChange,
  onColorChange,
  onRemove,
}: MatRowCardProps) {
  const sizes = useMatSizeStore((s) => s.sizes)
  const addSize = useMatSizeStore((s) => s.addSize)
  const [isCustom, setIsCustom] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSelectChange(value: string) {
    if (value === CUSTOM_VALUE) {
      setIsCustom(true)
      setCustomValue('')
      requestAnimationFrame(() => inputRef.current?.focus())
    } else {
      onSizeChange(value)
    }
  }

  function confirmCustomSize() {
    const trimmed = customValue.trim()
    if (!trimmed) {
      setIsCustom(false)
      return
    }

    const id = trimmed.toLowerCase().replace(/\s+/g, '')
    const exists = sizes.some((s) => s.id === id)

    if (!exists) {
      addSize(id, trimmed, 0, 0)
    }

    onSizeChange(id)
    setIsCustom(false)
    setCustomValue('')
  }

  function handleCustomKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      confirmCustomSize()
    } else if (e.key === 'Escape') {
      setIsCustom(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card/50 p-3 space-y-2">
      <div className="flex items-center gap-2">
        {isCustom ? (
          <div className="flex w-36 shrink-0 items-center gap-1">
            <input
              ref={inputRef}
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={handleCustomKeyDown}
              onBlur={confirmCustomSize}
              placeholder="Новый размер"
              aria-label={`Новый размер коврика ${index + 1}`}
              className={`${baseInput} w-full`}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onMouseDown={(e) => e.preventDefault()}
              onClick={confirmCustomSize}
              aria-label="Подтвердить размер"
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Select value={mat.size} onValueChange={handleSelectChange}>
            <SelectTrigger
              aria-label={`Размер коврика ${index + 1}`}
              className={`${baseInput} w-24 shrink-0 cursor-pointer`}
            >
              <SelectValue placeholder="Размер" />
            </SelectTrigger>
            <SelectContent>
              {sizes.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
              <SelectItem value={CUSTOM_VALUE}>
                <span className="text-muted-foreground">Другой…</span>
              </SelectItem>
            </SelectContent>
          </Select>
        )}

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
          <span className="flex h-9 w-10 items-center justify-center border-y border-border bg-card text-center tabular-nums text-base text-foreground">
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
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-red-400"
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
