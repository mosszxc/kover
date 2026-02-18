import { useState, useCallback } from 'react'
import { Printer, Check } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/shared/ui/popover'
import { DAY_LABELS } from '@/shared/types'
import { useRouteStore } from '../store'

interface DriverInfo {
  id: string
  name: string
}

interface PrintButtonProps {
  drivers?: DriverInfo[]
  selectedDriverIds?: string[]
  onSelectedDriverIdsChange?: (ids: string[]) => void
}

export function PrintButton({ drivers = [], selectedDriverIds = [], onSelectedDriverIdsChange }: PrintButtonProps) {
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const [open, setOpen] = useState(false)

  const hasDrivers = drivers.length > 0

  const allSelected = selectedDriverIds.length === 0
  const toggleDriver = useCallback(
    (driverId: string) => {
      if (!onSelectedDriverIdsChange) return
      if (selectedDriverIds.includes(driverId)) {
        onSelectedDriverIdsChange(selectedDriverIds.filter((id) => id !== driverId))
      } else {
        onSelectedDriverIdsChange([...selectedDriverIds, driverId])
      }
    },
    [selectedDriverIds, onSelectedDriverIdsChange],
  )

  const selectAll = useCallback(() => {
    onSelectedDriverIdsChange?.([])
  }, [onSelectedDriverIdsChange])

  const handlePrint = useCallback(() => {
    setOpen(false)
    // Small delay so popover closes before print dialog
    requestAnimationFrame(() => window.print())
  }, [])

  // No drivers — simple print button (legacy)
  if (!hasDrivers) {
    return (
      <Button
        variant="ghost"
        onClick={() => window.print()}
        className="print:hidden min-w-[44px] min-h-[44px] gap-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        aria-label={`Распечатать маршрут на ${DAY_LABELS[selectedDay]}`}
      >
        <Printer className="h-5 w-5" />
        <span className="hidden sm:inline">Печать</span>
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="print:hidden min-w-[44px] min-h-[44px] gap-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          aria-label={`Распечатать маршрут на ${DAY_LABELS[selectedDay]}`}
        >
          <Printer className="h-5 w-5" />
          <span className="hidden sm:inline">Печать</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <div className="space-y-2">
          <p className="text-sm font-medium">Печать для водителей</p>

          <button
            type="button"
            onClick={selectAll}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded border border-primary">
              {allSelected && <Check className="h-3 w-3 text-primary" />}
            </span>
            Все водители
          </button>

          {drivers.map((driver) => {
            const checked = allSelected || selectedDriverIds.includes(driver.id)
            return (
              <button
                key={driver.id}
                type="button"
                onClick={() => {
                  if (allSelected) {
                    // Switch from "all" to "all except this one"
                    onSelectedDriverIdsChange?.(drivers.filter((d) => d.id !== driver.id).map((d) => d.id))
                  } else {
                    toggleDriver(driver.id)
                  }
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded border border-primary">
                  {checked && <Check className="h-3 w-3 text-primary" />}
                </span>
                {driver.name}
              </button>
            )
          })}

          <Button onClick={handlePrint} className="mt-2 w-full min-h-[44px]">
            <Printer className="mr-2 h-4 w-4" />
            Печать
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
