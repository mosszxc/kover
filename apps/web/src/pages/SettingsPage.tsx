import { AutostartToggle, NotificationToggle, ThemeToggle, WeekendToggle } from '@/modules/settings'

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-2xl font-bold text-foreground">Настройки</h1>
      <ThemeToggle />
      <WeekendToggle />
      <NotificationToggle />
      <AutostartToggle />
    </div>
  )
}
