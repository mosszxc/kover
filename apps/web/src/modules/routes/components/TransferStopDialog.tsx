import { useState } from 'react'
import { ArrowRightLeft, Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import type { DayOfWeek } from '@/shared/types'
import { DAY_LABELS } from '@/shared/types'
import { useServiceLogStore } from '@/shared/stores/serviceLogStore'
import { useRouteStore } from '../store'

const DAYS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6]

interface TransferStopDialogProps {
  stopId: string
  clientId: string
  clientName: string
  day: DayOfWeek
  driverName?: string
}

export function TransferStopDialog({ stopId, clientId, clientName, day, driverName }: TransferStopDialogProps) {
  const [open, setOpen] = useState(false)
  const [targetDay, setTargetDay] = useState<DayOfWeek | null>(null)
  const [position, setPosition] = useState<number>(-1)
  const [isTransferring, setIsTransferring] = useState(false)

  const routes = useRouteStore((s) => s.routes)
  const transferStop = useRouteStore((s) => s.transferStop)
  const addServiceLog = useServiceLogStore((s) => s.addEntry)

  const targetRoute = targetDay !== null ? routes.find((r) => r.day === targetDay) : null
  const targetStops = targetRoute?.stops ?? []

  function handleTransfer() {
    if (targetDay === null || isTransferring) return
    setIsTransferring(true)
    transferStop(day, targetDay, stopId, position === -1 ? undefined : position)
    addServiceLog({ clientId, day, type: 'transferred', targetDay, driverName })
    setIsTransferring(false)
    setOpen(false)
    reset()
  }

  function reset() {
    setTargetDay(null)
    setPosition(-1)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <button
        type="button"
        aria-label="Перенести в другой день"
        onClick={() => setOpen(true)}
        className="flex size-6 min-h-[44px] min-w-[44px] items-center justify-center rounded text-muted-foreground transition-colors hover:text-blue-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 print:hidden"
      >
        <ArrowRightLeft className="size-4" />
      </button>

      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Перенести {clientName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Выберите день</p>
            <div className="grid grid-cols-3 gap-2">
              {DAYS.filter((d) => d !== day).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => { setTargetDay(d); setPosition(-1) }}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                    targetDay === d
                      ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                      : 'border-border text-foreground hover:border-ring'
                  }`}
                >
                  {DAY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          {targetDay !== null && targetStops.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Позиция</p>
              <Select
                value={String(position)}
                onValueChange={(value) => setPosition(Number(value))}
              >
                <SelectTrigger className="h-11 w-full border-border bg-card text-sm text-foreground">
                  <SelectValue placeholder="Позиция" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-1">В конец</SelectItem>
                  {targetStops.map((_stop, i) => (
                    <SelectItem key={i} value={String(i)}>
                      После точки №{i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setOpen(false); reset() }} disabled={isTransferring}>
              Отмена
            </Button>
            <Button disabled={targetDay === null || isTransferring} onClick={handleTransfer}>
              {isTransferring ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Перенос...
                </>
              ) : (
                'Перенести'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
