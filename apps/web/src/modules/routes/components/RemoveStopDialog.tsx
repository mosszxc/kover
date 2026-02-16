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
import { useServiceLogStore } from '@/shared/stores/serviceLogStore'
import { useRouteStore } from '../store'
import { SkipDateDialog } from './SkipDateDialog'

interface RemoveStopDialogProps {
  stopId: string
  clientId: string
  clientName: string
  day: DayOfWeek
  driverName?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RemoveStopDialog({ stopId, clientId, clientName, day, driverName, open, onOpenChange }: RemoveStopDialogProps) {
  const removeStop = useRouteStore((s) => s.removeStop)
  const skipStop = useRouteStore((s) => s.skipStop)
  const addServiceLog = useServiceLogStore((s) => s.addEntry)
  const [skipDateOpen, setSkipDateOpen] = useState(false)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Убрать из маршрута?</DialogTitle>
            <DialogDescription>
              {clientName} — маршрут на {DAY_LABELS[day]}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                onOpenChange(false)
                setSkipDateOpen(true)
              }}
            >
              <span className="flex flex-col items-start">
                <span>Пропустить на конкретную дату</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Не приезжать в выбранный день, потом вернётся сам
                </span>
              </span>
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                skipStop(day, stopId)
                addServiceLog({ clientId, day, type: 'skipped', driverName })
                onOpenChange(false)
              }}
            >
              <span className="flex flex-col items-start">
                <span>Пропустить на эту неделю</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Вернётся автоматически в следующий {DAY_LABELS[day]}
                </span>
              </span>
            </Button>
            <Button
              variant="destructive"
              className="justify-start"
              onClick={() => {
                removeStop(day, stopId)
                addServiceLog({ clientId, day, type: 'removed', driverName })
                onOpenChange(false)
              }}
            >
              <span className="flex flex-col items-start">
                <span>Убрать навсегда</span>
                <span className="text-xs font-normal text-destructive-foreground/70">
                  Клиент останется в базе, но пропадёт из маршрута
                </span>
              </span>
            </Button>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Отмена</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SkipDateDialog
        clientId={clientId}
        clientName={clientName}
        day={day}
        open={skipDateOpen}
        onOpenChange={setSkipDateOpen}
      />
    </>
  )
}
