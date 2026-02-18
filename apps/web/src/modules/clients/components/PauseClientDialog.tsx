import { useState } from 'react'
import { CalendarOff } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'

interface PauseClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientName: string
  onPause: (pausedUntil: string | null) => void
}

export function PauseClientDialog({ open, onOpenChange, clientName, onPause }: PauseClientDialogProps) {
  const [date, setDate] = useState('')

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().slice(0, 10)

  function handlePauseIndefinitely() {
    onPause(null)
    onOpenChange(false)
    setDate('')
  }

  function handlePauseUntilDate() {
    if (!date) return
    onPause(date)
    onOpenChange(false)
    setDate('')
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setDate('') }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarOff className="size-5 text-amber-400" />
            Пауза: {clientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Пауза до даты</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={date}
                min={minDate}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <Button
                onClick={handlePauseUntilDate}
                disabled={!date}
                size="sm"
              >
                Поставить
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Клиент автоматически вернётся в активные после этой даты
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-2 text-muted-foreground">или</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handlePauseIndefinitely}
          >
            Бессрочная пауза
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
