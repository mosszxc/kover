import { useState, useEffect, useCallback } from 'react'
import { Save, RotateCcw, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import {
  saveBackup,
  listBackups,
  restoreBackup,
  deleteBackup,
  type BackupMeta,
} from '@/shared/lib/backup'
import { collectStores, restoreStores } from '@/shared/lib/backupStores'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function BackupSummary({ backup }: { backup: BackupMeta }) {
  const parts: string[] = []

  if (backup.clientCount > 0) parts.push(`${backup.clientCount} клиентов`)
  if (backup.routeStopCount > 0) parts.push(`${backup.routeStopCount} точек`)
  if (backup.driverCount > 0) parts.push(`${backup.driverCount} водителей`)
  if (backup.paymentCount > 0) parts.push(`${backup.paymentCount} оплат`)
  if (backup.inventorySizeCount > 0) parts.push(`${backup.inventorySizeCount} размеров`)
  if (backup.serviceReportCount > 0) parts.push(`${backup.serviceReportCount} отчётов`)

  if (parts.length === 0) parts.push('Пустой бекап')

  return <span>{parts.join(', ')}</span>
}

export function BackupManager() {
  const [backups, setBackups] = useState<BackupMeta[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setBackups(await listBackups())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleCreateBackup() {
    setLoading(true)
    try {
      const stores = collectStores()
      await saveBackup(stores)
      await refresh()
      toast.success('Бекап создан')
    } catch {
      toast.error('Ошибка создания бекапа')
    } finally {
      setLoading(false)
    }
  }

  async function handleRestore(key: string) {
    const data = await restoreBackup(key)
    if (!data) {
      toast.error('Бекап не найден')
      return
    }

    restoreStores(data)
    toast.success('Данные восстановлены из бекапа')
  }

  async function handleDelete(key: string) {
    await deleteBackup(key)
    await refresh()
    toast.success('Бекап удалён')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Бекапы</h2>
        <Button variant="outline" size="sm" onClick={handleCreateBackup} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Создать бекап
        </Button>
      </div>

      {backups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Нет бекапов. Бекапы создаются автоматически каждые 30 минут.
        </p>
      ) : (
        <div className="space-y-2">
          {backups.map((backup) => (
            <div
              key={backup.key}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
            >
              <div>
                <div className="text-sm text-foreground">{formatDate(backup.timestamp)}</div>
                <div className="text-sm text-muted-foreground">
                  <BackupSummary backup={backup} />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Восстановить бекап">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Восстановить бекап?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Текущие данные будут заменены данными из бекапа от{' '}
                        {formatDate(backup.timestamp)}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleRestore(backup.key)}>
                        Восстановить
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
                  onClick={() => handleDelete(backup.key)}
                  aria-label="Удалить бекап"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
