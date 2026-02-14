import { useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useSyncStore, migrateLocalStorageToPb } from '@/shared/lib/sync'
import { toast } from 'sonner'

export function SyncMigrationDialog() {
  const status = useSyncStore((s) => s.status)
  const isMigrated = useSyncStore((s) => s.isMigrated)
  const [migrating, setMigrating] = useState(false)

  // Only show when online and not yet migrated
  if (status !== 'online' || isMigrated) return null

  const handleMigrate = async () => {
    setMigrating(true)
    try {
      await migrateLocalStorageToPb()
      toast.success('Данные загружены в облако')
    } catch (err) {
      toast.error('Ошибка миграции: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'))
    } finally {
      setMigrating(false)
    }
  }

  const handleSkip = () => {
    useSyncStore.getState().setMigrated(true)
  }

  return (
    <div className="fixed bottom-20 right-4 md:bottom-4 z-50 max-w-sm rounded-lg border bg-card p-4 shadow-lg">
      <h3 className="font-medium text-sm mb-2">Загрузить данные в облако?</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Ваши текущие данные из браузера будут загружены в PocketBase для синхронизации между устройствами.
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleMigrate} disabled={migrating}>
          {migrating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Upload className="h-4 w-4 mr-1" />
          )}
          Загрузить
        </Button>
        <Button size="sm" variant="ghost" onClick={handleSkip} disabled={migrating}>
          Пропустить
        </Button>
      </div>
    </div>
  )
}
