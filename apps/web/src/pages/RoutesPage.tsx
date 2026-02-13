import { useState } from 'react'
import { DaySwitcher, DaySummary, RouteSearch, StopList } from '@/modules/routes'

export function RoutesPage() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="space-y-4">
      <DaySwitcher />
      <DaySummary />
      <RouteSearch value={searchQuery} onChange={setSearchQuery} />
      <StopList searchQuery={searchQuery} />
    </div>
  )
}
