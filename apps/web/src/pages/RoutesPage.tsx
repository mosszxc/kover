import { useState } from 'react'
import { DaySwitcher, DaySummary, RouteSearch, StopList, AddStopDialog } from '@/modules/routes'
import { useClientStore } from '@/modules/clients'

export function RoutesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const clients = useClientStore((s) => s.clients)

  return (
    <div className="space-y-4">
      <DaySwitcher />
      <DaySummary />
      <RouteSearch value={searchQuery} onChange={setSearchQuery} />
      <StopList searchQuery={searchQuery} />
      <AddStopDialog clients={clients} />
    </div>
  )
}
