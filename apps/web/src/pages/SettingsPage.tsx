import { NotificationToggle, WeekendToggle } from '@/modules/settings'

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-2xl font-bold text-slate-50">Настройки</h1>
      <WeekendToggle />
      <NotificationToggle />
    </div>
  )
}
