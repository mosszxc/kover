import { Cloud, CloudOff, Loader2, AlertTriangle } from 'lucide-react'
import { useSyncStore } from '@/shared/lib/sync'

export function SyncStatusIndicator() {
  const status = useSyncStore((s) => s.status)
  const error = useSyncStore((s) => s.error)

  if (status === 'online') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-500" title="Синхронизировано">
        <Cloud className="h-3.5 w-3.5" />
        <span className="hidden md:inline">Онлайн</span>
      </div>
    )
  }

  if (status === 'connecting') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span className="hidden md:inline">Подключение...</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive" title={error || 'Ошибка синхронизации'}>
        <AlertTriangle className="h-3.5 w-3.5" />
        <span className="hidden md:inline">Ошибка</span>
      </div>
    )
  }

  // offline
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground" title="Работа оффлайн">
      <CloudOff className="h-3.5 w-3.5" />
      <span className="hidden md:inline">Оффлайн</span>
    </div>
  )
}
