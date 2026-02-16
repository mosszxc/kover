import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { toast } from 'sonner'

interface StockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sizeId: string
  sizeLabel: string
  mode: 'purchase' | 'write_off'
  onSubmit: (quantity: number, notes: string) => void
}

export function StockDialog({ open, onOpenChange, sizeLabel, mode, onSubmit }: StockDialogProps) {
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')

  const title = mode === 'purchase' ? 'Поступление ковриков' : 'Списание ковриков'

  function handleSubmit() {
    const qty = parseInt(quantity, 10)
    if (!qty || qty <= 0) {
      toast.error('Введите количество')
      return
    }
    onSubmit(qty, notes)
    toast.success(mode === 'purchase' ? `+${qty} шт (${sizeLabel})` : `-${qty} шт (${sizeLabel})`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Размер</p>
            <p className="font-medium">{sizeLabel}</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="stock-qty" className="text-sm text-muted-foreground">
              Количество
            </label>
            <input
              id="stock-qty"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm tabular-nums text-foreground focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="stock-notes" className="text-sm text-muted-foreground">
              Причина / заметка
            </label>
            <input
              id="stock-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={mode === 'write_off' ? 'Износ, потеря...' : 'Закупка, возврат...'}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit}>
            {mode === 'purchase' ? 'Добавить' : 'Списать'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
