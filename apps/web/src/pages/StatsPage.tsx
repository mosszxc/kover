import { WeeklySummary, DayLoadChart, ClientStats, BusinessTrends, DebtAging, RevenueChart, ChurnRiskWidget, RouteStabilityWidget, LaundryForecastWidget } from '@/modules/stats'
import { useClientStore } from '@/modules/clients'
import { useRouteStore } from '@/modules/routes'
import { useRouteSettingsStore } from '@/shared/stores/routeSettingsStore'
import { ChangeLog } from '@/shared/components/ChangeLog'
import { BackupManager } from '@/shared/components/BackupManager'

export function StatsPage() {
  const clients = useClientStore((s) => s.clients)
  const routes = useRouteStore((s) => s.routes)
  const maxStopsPerDay = useRouteSettingsStore((s) => s.maxStopsPerDay)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Статистика</h1>
      <ChurnRiskWidget />
      <RouteStabilityWidget />
      <LaundryForecastWidget />
      <RevenueChart />
      <DebtAging />
      <WeeklySummary />
      <DayLoadChart />
      <ClientStats />
      <BusinessTrends clients={clients} routes={routes} maxStopsPerDay={maxStopsPerDay} />
      <ChangeLog />
      <BackupManager />
    </div>
  )
}
