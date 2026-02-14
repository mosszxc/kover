import { isTauri } from '@/shared/lib/platform'

/**
 * If the app was launched with startMinimized enabled, hide the window to tray.
 * Called once at app init, before React renders.
 */
export function applyStartMinimized(): void {
  if (!isTauri()) return

  try {
    const raw = localStorage.getItem('kover-settings')
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (parsed?.state?.startMinimized) {
      import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
        getCurrentWindow().hide()
      })
    }
  } catch {
    // ignore parse errors
  }
}
