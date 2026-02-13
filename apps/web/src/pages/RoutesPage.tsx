import { useMemo, useState } from 'react'
import { DaySwitcher, DaySummary, RouteSearch, StopList, AddStopDialog, useRouteStore, PrintButton, DriverFilter } from '@/modules/routes'
import { useClientStore } from '@/modules/clients'
import { useDriverStore } from '@/modules/drivers'
import { PrintSheet } from '@/modules/print'
import { OptimizeRouteDialog } from '@/modules/map'

export function RoutesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [driverFilter, setDriverFilter] = useState<string | 'unassigned' | null>(null)
  const clients = useClientStore((s) => s.clients)
  const allDrivers = useDriverStore((s) => s.drivers)
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const stops = useRouteStore((s) => s.routes.find((r) => r.day === selectedDay)?.stops ?? [])

  const driverOptions = useMemo(
    () => allDrivers.filter((d) => d.isActive).map((d) => ({ id: d.id, name: d.name })),
    [allDrivers],
  )

  const activeClientIds = useMemo(
    () => new Set(clients.filter((c) => c.isActive).map((c) => c.id)),
    [clients],
  )
  const activeStops = useMemo(
    () => stops.filter((s) => activeClientIds.has(s.clientId)),
    [stops, activeClientIds],
  )

  return (
    <div>
      <div className="space-y-4 print:hidden">
        <div className="flex items-center justify-between gap-2">
          <DaySwitcher />
          <OptimizeRouteDialog />
          <PrintButton />
        </div>
        <DaySummary />
        <DriverFilter drivers={driverOptions} value={driverFilter} onChange={setDriverFilter} />
        <RouteSearch value={searchQuery} onChange={setSearchQuery} />
        <StopList searchQuery={searchQuery} drivers={driverOptions} driverFilter={driverFilter} />
        <AddStopDialog clients={clients} />
      </div>
      <PrintSheet stops={activeStops} clients={clients} selectedDay={selectedDay} />
    </div>
  )
}
