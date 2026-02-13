import { WeeklySummary, DayLoadChart } from '@/modules/stats'

export function StatsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-50">Статистика</h1>
      <WeeklySummary />
      <DayLoadChart />
    </div>
  )
}
