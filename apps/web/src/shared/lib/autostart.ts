import { isTauri } from '@/shared/lib/platform'
import { useSettingsStore } from '@/shared/stores/settingsStore'

/**
 * If the app was launched with startMinimized enabled, hide the window to tray.
 * Called once at app init, before React renders.
 */
export function applyStartMinimized(): void {
  if (!isTauri()) return

  try {
    const { startMinimized } = useSettingsStore.getState()
    if (startMinimized) {
      import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
        getCurrentWindow().hide()
      })
    }
  } catch {
    // ignore errors
  }
}
