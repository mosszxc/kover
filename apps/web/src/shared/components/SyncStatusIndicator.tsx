import { Cloud, CloudOff, Loader2, AlertCircle } from 'lucide-react'
import { useSyncStore } from '@/shared/lib/sync'
import { isSupabaseConfigured } from '@/shared/lib/supabase'

export function SyncStatusIndicator() {
  const status = useSyncStore((s) => s.status)
  const error = useSyncStore((s) => s.error)
  const lastSyncAt = useSyncStore((s) => s.lastSyncAt)

  if (!isSupabaseConfigured()) return null

  const config = {
    idle: {
      icon: Cloud,
      className: 'text-green-500',
      label: lastSyncAt
        ? `Синхронизировано ${new Date(lastSyncAt).toLocaleTimeString('ru-RU')}`
        : 'Подключено к облаку',
    },
    syncing: {
      icon: Loader2,
      className: 'text-blue-500 animate-spin',
      label: 'Синхронизация...',
    },
    error: {
      icon: AlertCircle,
      className: 'text-red-500',
      label: error ?? 'Ошибка синхронизации',
    },
    offline: {
      icon: CloudOff,
      className: 'text-muted-foreground',
      label: 'Оффлайн — данные сохраняются локально',
    },
  }[status]

  const Icon = config.icon

  return (
    <div className="flex h-8 w-8 items-center justify-center" title={config.label}>
      <Icon className={`h-4 w-4 ${config.className}`} />
    </div>
  )
}
