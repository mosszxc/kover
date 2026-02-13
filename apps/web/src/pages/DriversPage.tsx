import { useState } from 'react'
import { toast } from 'sonner'
import {
  type Driver,
  useDriverStore,
  DriversList,
  AddDriverDialog,
  EditDriverDialog,
} from '@/modules/drivers'

export function DriversPage() {
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const deleteDriver = useDriverStore((s) => s.deleteDriver)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Водители</h1>
        <AddDriverDialog />
      </div>

      <DriversList onRowClick={setSelectedDriver} />

      {selectedDriver && (
        <EditDriverDialog
          driver={selectedDriver}
          open={!!selectedDriver}
          onOpenChange={(open) => {
            if (!open) setSelectedDriver(null)
          }}
          onDelete={(id) => {
            const name = selectedDriver.name
            deleteDriver(id)
            setSelectedDriver(null)
            toast.success(`Водитель "${name}" удалён`)
          }}
        />
      )}
    </div>
  )
}
