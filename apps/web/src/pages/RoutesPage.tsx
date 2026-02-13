import { useState } from 'react'
import { DaySwitcher, DaySummary, RouteSearch, StopList, AddStopDialog, useRouteStore, PrintButton } from '@/modules/routes'
import { useClientStore } from '@/modules/clients'
import { PrintSheet } from '@/modules/print'

export function RoutesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const clients = useClientStore((s) => s.clients)
  const selectedDay = useRouteStore((s) => s.selectedDay)
  const stops = useRouteStore((s) => s.routes.find((r) => r.day === selectedDay)?.stops ?? [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <DaySwitcher />
        <PrintButton />
      </div>
      <DaySummary />
      <RouteSearch value={searchQuery} onChange={setSearchQuery} />
      <StopList searchQuery={searchQuery} />
      <AddStopDialog clients={clients} />
      <PrintSheet stops={stops} clients={clients} selectedDay={selectedDay} />
    </div>
  )
}
