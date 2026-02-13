import { DaySwitcher, DaySummary, StopList } from '@/modules/routes'

export function RoutesPage() {
  return (
    <div className="space-y-4">
      <DaySwitcher />
      <DaySummary />
      <StopList />
    </div>
  )
}
