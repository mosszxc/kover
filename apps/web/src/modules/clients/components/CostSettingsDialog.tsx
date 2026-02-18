import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { useCostSettingsStore } from '@/shared/stores/costSettingsStore'
import { toast } from 'sonner'

export function CostSettingsDialog() {
  const { laundryCostPerSqm, logisticsCostPerStop, update } = useCostSettingsStore()
  const [open, setOpen] = useState(false)
  const [laundry, setLaundry] = useState(String(laundryCostPerSqm))
  const [logistics, setLogistics] = useState(String(logisticsCostPerStop))

  function handleOpen(isOpen: boolean) {
    if (isOpen) {
      setLaundry(String(laundryCostPerSqm))
      setLogistics(String(logisticsCostPerStop))
    }
    setOpen(isOpen)
  }

  function handleSave() {
    update({
      laundryCostPerSqm: parseFloat(laundry) || 0,
      logisticsCostPerStop: parseFloat(logistics) || 0,
    })
    toast.success('Настройки себестоимости сохранены')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Settings2 className="size-4" />
          Себестоимость
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Настройки себестоимости</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="laundry-cost" className="text-sm text-muted-foreground">
              Стоимость стирки (₽ за м²)
            </label>
            <input
              id="laundry-cost"
              type="number"
              min={0}
              step={0.1}
              value={laundry}
              onChange={(e) => setLaundry(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm tabular-nums text-foreground focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
            />
            <p className="text-sm text-muted-foreground">Стоимость стирки одного кв. метра коврика</p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="logistics-cost" className="text-sm text-muted-foreground">
              Логистика (₽ за визит)
            </label>
            <input
              id="logistics-cost"
              type="number"
              min={0}
              step={1}
              value={logistics}
              onChange={(e) => setLogistics(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm tabular-nums text-foreground focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
            />
            <p className="text-sm text-muted-foreground">Средняя стоимость доставки на одну точку (топливо, амортизация)</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
