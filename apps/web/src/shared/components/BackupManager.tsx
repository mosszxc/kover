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
import { useRouteStore } from '@/modules/routes'
import { useClientStore } from '@/modules/clients'
import {
  saveBackup,
  listBackups,
  restoreBackup,
  deleteBackup,
  type BackupMeta,
} from '@/shared/lib/backup'
import type { Client } from '@/modules/clients'
import type { DayRoute } from '@/modules/routes'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function BackupManager() {
  const [backups, setBackups] = useState<BackupMeta[]>([])
  const [loading, setLoading] = useState(false)
  const seedClients = useClientStore((s) => s.seedClients)
  const seedRoutes = useRouteStore((s) => s.seedRoutes)

  const refresh = useCallback(async () => {
    setBackups(await listBackups())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleCreateBackup() {
    setLoading(true)
    try {
      const clients = useClientStore.getState().clients
      const routes = useRouteStore.getState().routes
      await saveBackup(clients, routes)
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

    seedClients(data.clients as Client[])
    seedRoutes(data.routes as DayRoute[])
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
        <h2 className="text-lg font-semibold text-slate-50">Бекапы</h2>
        <Button variant="outline" size="sm" onClick={handleCreateBackup} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Создать бекап
        </Button>
      </div>

      {backups.length === 0 ? (
        <p className="text-sm text-slate-500">
          Нет бекапов. Бекапы создаются автоматически каждые 30 минут.
        </p>
      ) : (
        <div className="space-y-2">
          {backups.map((backup) => (
            <div
              key={backup.key}
              className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-4 py-3"
            >
              <div>
                <div className="text-sm text-slate-50">{formatDate(backup.timestamp)}</div>
                <div className="text-xs text-slate-400">
                  {backup.clientCount} клиентов, {backup.routeStopCount} точек
                </div>
              </div>
              <div className="flex items-center gap-1">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                  className="h-8 w-8 p-0 text-slate-500 hover:text-red-400"
                  onClick={() => handleDelete(backup.key)}
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
