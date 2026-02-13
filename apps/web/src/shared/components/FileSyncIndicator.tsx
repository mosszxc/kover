import { HardDrive } from 'lucide-react'
import { useSettingsStore } from '@/shared/stores/settingsStore'
import { isFileSyncSupported } from '@/shared/lib/filesync'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function FileSyncIndicator() {
  const fileSyncEnabled = useSettingsStore((s) => s.fileSyncEnabled)
  const lastFileSyncAt = useSettingsStore((s) => s.lastFileSyncAt)

  if (!isFileSyncSupported() || !fileSyncEnabled) return null

  return (
    <div
      className="flex items-center gap-1 text-xs text-emerald-400 px-2"
      title={lastFileSyncAt ? `Сохранено на диск: ${formatTime(lastFileSyncAt)}` : 'Автосохранение на диск подключено'}
    >
      <HardDrive className="h-3.5 w-3.5" />
      {lastFileSyncAt && <span className="hidden sm:inline">{formatTime(lastFileSyncAt)}</span>}
    </div>
  )
}
