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
import { usePaymentStore } from '../store'
import { getCurrentPeriod, formatPeriod } from '../types'
import type { Payment } from '../types'

interface RecordPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
  expectedAmount: number
  existingPayment?: Payment | null
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  expectedAmount,
  existingPayment,
}: RecordPaymentDialogProps) {
  const addPayment = usePaymentStore((s) => s.addPayment)
  const updatePayment = usePaymentStore((s) => s.updatePayment)
  const currentPeriod = getCurrentPeriod()

  const [amount, setAmount] = useState(
    existingPayment ? String(existingPayment.paidAmount) : String(expectedAmount),
  )
  const [notes, setNotes] = useState(existingPayment?.notes ?? '')

  function handleSubmit() {
    const paidAmount = parseFloat(amount) || 0
    if (paidAmount <= 0) {
      toast.error('Введите сумму оплаты')
      return
    }

    if (existingPayment) {
      updatePayment(existingPayment.id, {
        paidAmount,
        paidAt: new Date().toISOString(),
        notes,
      })
      toast.success('Оплата обновлена')
    } else {
      addPayment({
        id: crypto.randomUUID(),
        clientId,
        period: currentPeriod,
        expectedAmount,
        paidAmount,
        paidAt: new Date().toISOString(),
        notes,
        createdAt: new Date().toISOString(),
      })
      toast.success('Оплата записана')
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Записать оплату</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Клиент</p>
            <p className="font-medium">{clientName}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Период</p>
            <p className="font-medium">{formatPeriod(currentPeriod)}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">К оплате</p>
            <p className="font-medium tabular-nums">{expectedAmount.toLocaleString('ru-RU')}{'\u00a0'}₽</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pay-amount" className="text-sm text-muted-foreground">
              Сумма оплаты
            </label>
            <input
              id="pay-amount"
              type="number"
              min={0}
              step={0.01}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm tabular-nums text-foreground focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setAmount(String(expectedAmount))}
            >
              Полная сумма
            </Button>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pay-notes" className="text-sm text-muted-foreground">
              Заметка
            </label>
            <input
              id="pay-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Необязательно"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit}>
            {existingPayment ? 'Обновить' : 'Записать'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
