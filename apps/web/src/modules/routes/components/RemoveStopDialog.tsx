import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import { X } from 'lucide-react'
import { DAY_LABELS } from '@/shared/types'
import type { DayOfWeek } from '@/shared/types'
import { useRouteStore } from '../store'

interface RemoveStopDialogProps {
  stopId: string
  clientName: string
  day: DayOfWeek
}

export function RemoveStopDialog({ stopId, clientName, day }: RemoveStopDialogProps) {
  const removeStop = useRouteStore((s) => s.removeStop)

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          aria-label={`Убрать ${clientName} из маршрута`}
          className="flex size-6 min-h-[44px] min-w-[44px] items-center justify-center rounded text-slate-400 transition-colors hover:text-red-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 print:hidden"
        >
          <X className="size-4" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Убрать из маршрута?</AlertDialogTitle>
          <AlertDialogDescription>
            {clientName} будет убран из маршрута на {DAY_LABELS[day]}. Клиент останется в базе.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => removeStop(day, stopId)}
          >
            Убрать
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
