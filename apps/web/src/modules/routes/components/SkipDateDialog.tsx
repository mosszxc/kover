import { useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { DAY_LABELS } from '@/shared/types'
import type { DayOfWeek } from '@/shared/types'
import { useRouteExceptionsStore } from '@/shared/stores/routeExceptionsStore'
import { useServiceLogStore } from '@/shared/stores/serviceLogStore'

interface SkipDateDialogProps {
  clientId: string
  clientName: string
  day: DayOfWeek
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getNextOccurrences(day: DayOfWeek, count: number): string[] {
  const jsDay = ((day + 1) % 7) // DayOfWeek: 0=Mon..6=Sun → JS: 1=Mon..0=Sun
  const today = new Date()
  const dates: string[] = []
  const d = new Date(today)

  for (let i = 0; i < 28 && dates.length < count; i++) {
    if (d.getDay() === jsDay && d >= today) {
      dates.push(d.toISOString().slice(0, 10))
    }
    d.setDate(d.getDate() + 1)
  }
  return dates
}

function formatDateRu(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export function SkipDateDialog({ clientId, clientName, day, open, onOpenChange }: SkipDateDialogProps) {
  const addException = useRouteExceptionsStore((s) => s.addException)
  const addServiceLog = useServiceLogStore((s) => s.addEntry)
  const [selectedDate, setSelectedDate] = useState('')
  const [reason, setReason] = useState('')

  const nextDates = getNextOccurrences(day, 4)

  function handleSkip(date: string) {
    addException({ clientId, date, type: 'skip', day, reason: reason || undefined })
    addServiceLog({ clientId, day, type: 'skipped', details: `Пропуск на ${formatDateRu(date)}${reason ? `: ${reason}` : ''}` })
    setSelectedDate('')
    setReason('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Пропустить на дату</DialogTitle>
          <DialogDescription>
            {clientName} — {DAY_LABELS[day]}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">Ближайшие даты:</p>
            <div className="flex flex-wrap gap-2">
              {nextDates.map((date) => (
                <Button
                  key={date}
                  variant={selectedDate === date ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDate(date)}
                >
                  {formatDateRu(date)}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="skip-date-custom" className="text-sm text-muted-foreground">
              Или выберите дату:
            </label>
            <input
              id="skip-date-custom"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="skip-reason" className="text-sm text-muted-foreground">
              Причина (необязательно):
            </label>
            <input
              id="skip-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ремонт, праздник..."
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Отмена</Button>
          </DialogClose>
          <Button
            disabled={!selectedDate}
            onClick={() => handleSkip(selectedDate)}
          >
            Пропустить {selectedDate ? formatDateRu(selectedDate) : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
