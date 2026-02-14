import { useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { X } from 'lucide-react'
import { DAY_LABELS } from '@/shared/types'
import type { DayOfWeek } from '@/shared/types'
import { useServiceLogStore } from '@/shared/stores/serviceLogStore'
import { useRouteStore } from '../store'

interface RemoveStopDialogProps {
  stopId: string
  clientId: string
  clientName: string
  day: DayOfWeek
  driverName?: string
}

export function RemoveStopDialog({ stopId, clientId, clientName, day, driverName }: RemoveStopDialogProps) {
  const removeStop = useRouteStore((s) => s.removeStop)
  const skipStop = useRouteStore((s) => s.skipStop)
  const addServiceLog = useServiceLogStore((s) => s.addEntry)
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Убрать ${clientName} из маршрута`}
          className="flex size-6 min-h-[44px] min-w-[44px] items-center justify-center rounded text-muted-foreground transition-colors hover:text-red-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 print:hidden"
        >
          <X className="size-4" />
        </button>
      </DialogTrigger>
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
              skipStop(day, stopId)
              addServiceLog({ clientId, day, type: 'skipped', driverName })
              setOpen(false)
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
              setOpen(false)
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
  )
}
