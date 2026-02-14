import { toast } from 'sonner'
import { isTauri } from '@/shared/lib/platform'
import { useSettingsStore } from '@/shared/stores/settingsStore'

interface NotifyOptions {
  title: string
  body: string
}

let tauriNotification: typeof import('@tauri-apps/plugin-notification') | null =
  null

async function getTauriNotification() {
  if (!isTauri()) return null
  if (tauriNotification) return tauriNotification
  try {
    tauriNotification = await import('@tauri-apps/plugin-notification')
    return tauriNotification
  } catch {
    return null
  }
}

async function ensurePermission(): Promise<boolean> {
  const mod = await getTauriNotification()
  if (!mod) return false
  if (await mod.isPermissionGranted()) return true
  return (await mod.requestPermission()) === 'granted'
}

/**
 * Sends a native OS notification (Tauri) or falls back to Sonner toast (browser).
 */
export async function notify({ title, body }: NotifyOptions): Promise<void> {
  const enabled = useSettingsStore.getState().notificationsEnabled
  if (!enabled) return

  const mod = await getTauriNotification()
  if (mod && (await ensurePermission())) {
    mod.sendNotification({ title, body })
    return
  }

  // Fallback: Sonner toast in browser
  toast.info(body, { description: title })
}

/**
 * Request notification permission proactively (e.g. on settings toggle).
 * Returns true if permission is granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const mod = await getTauriNotification()
  if (!mod) return false
  return ensurePermission()
}
