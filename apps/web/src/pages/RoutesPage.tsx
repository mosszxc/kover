import { useMemo, useState } from 'react'
import { DaySwitcher, DaySummary, RouteSearch, StopList, AddStopDialog, useRouteStore, PrintButton } from '@/modules/routes'
import { useClientStore } from '@/modules/clients'
import { PrintSheet } from '@/modules/print'
import { OptimizeRouteDialog } from '@/modules/map'

export function RoutesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const clients = useClientStore((s) => s.clients)
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const stops = useRouteStore((s) => s.routes.find((r) => r.day === selectedDay)?.stops ?? [])

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
        <RouteSearch value={searchQuery} onChange={setSearchQuery} />
        <StopList searchQuery={searchQuery} />
        <AddStopDialog clients={clients} />
      </div>
      <PrintSheet stops={activeStops} clients={clients} selectedDay={selectedDay} />
    </div>
  )
}
