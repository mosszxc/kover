import { Printer } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { DAY_LABELS } from '@/shared/types'
import { useRouteStore } from '../store'

export function PrintButton() {
  const selectedDay = useRouteStore((s) => s.selectedDay)

  return (
    <Button
      variant="ghost"
      onClick={() => window.print()}
      className="print:hidden min-w-[44px] min-h-[44px] gap-2 text-slate-400 hover:bg-slate-800 hover:text-slate-300"
      aria-label={`Распечатать маршрут на ${DAY_LABELS[selectedDay]}`}
    >
      <Printer className="h-5 w-5" />
      <span className="hidden sm:inline">Печать</span>
    </Button>
  )
}
