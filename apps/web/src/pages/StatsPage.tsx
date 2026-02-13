import { WeeklySummary, DayLoadChart, ClientStats } from '@/modules/stats'
import { ChangeLog } from '@/shared/components/ChangeLog'
import { BackupManager } from '@/shared/components/BackupManager'

export function StatsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Статистика</h1>
      <WeeklySummary />
      <DayLoadChart />
      <ClientStats />
      <ChangeLog />
      <BackupManager />
    </div>
  )
}
