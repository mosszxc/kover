import { Moon, Sun } from 'lucide-react'
import { useSettingsStore } from '@/shared/stores/settingsStore'

export function ThemeToggle() {
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)

  const isDark = theme === 'dark'

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Тема оформления</h2>
        <p className="text-sm text-muted-foreground">
          Выберите светлую или тёмную тему интерфейса
        </p>
      </div>

      <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-4 py-3">
        <div className="flex items-center gap-3">
          {isDark ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-muted-foreground" />}
          <div>
            <span className="text-sm font-medium text-foreground">
              {isDark ? 'Тёмная тема' : 'Светлая тема'}
            </span>
            <p className="text-sm text-muted-foreground">
              {isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            isDark ? 'bg-primary' : 'bg-input'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-background shadow-sm transition-transform ${
              isDark ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </label>
    </div>
  )
}
