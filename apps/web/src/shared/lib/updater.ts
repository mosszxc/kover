import { toast } from 'sonner'
import { isTauri } from '@/shared/lib/platform'

/**
 * Checks for app updates on startup. Shows a toast if a new version is available.
 * Only works in Tauri desktop environment.
 */
export function checkForUpdates(): void {
  if (!isTauri()) return

  // Delay check to not block app startup
  setTimeout(() => {
    doCheck()
  }, 3000)
}

async function doCheck(): Promise<void> {
  try {
    const { check } = await import('@tauri-apps/plugin-updater')
    const update = await check()

    if (!update) return

    toast(`Доступна версия ${update.version}`, {
      description: update.body || 'Новая версия готова к установке',
      duration: Infinity,
      action: {
        label: 'Обновить',
        onClick: () => installUpdate(update),
      },
    })
  } catch {
    // Silently ignore update check failures (offline, etc.)
  }
}

async function installUpdate(update: Awaited<ReturnType<typeof import('@tauri-apps/plugin-updater')['check']>>): Promise<void> {
  if (!update) return

  const toastId = toast.loading('Скачивание обновления...', { duration: Infinity })

  try {
    let totalLength = 0
    let downloadedLength = 0

    await update.downloadAndInstall((event) => {
      if (event.event === 'Started' && event.data.contentLength) {
        totalLength = event.data.contentLength
      } else if (event.event === 'Progress') {
        downloadedLength += event.data.chunkLength
        if (totalLength > 0) {
          const percent = Math.round((downloadedLength / totalLength) * 100)
          toast.loading(`Скачивание обновления... ${percent}%`, { id: toastId, duration: Infinity })
        }
      } else if (event.event === 'Finished') {
        toast.loading('Установка обновления...', { id: toastId, duration: Infinity })
      }
    })

    toast.success('Обновление установлено. Перезапуск...', { id: toastId, duration: 2000 })

    // Relaunch after a short delay so user sees the success message
    const { relaunch } = await import('@tauri-apps/plugin-process')
    setTimeout(() => {
      relaunch()
    }, 2000)
  } catch {
    toast.error('Не удалось установить обновление', { id: toastId })
  }
}
