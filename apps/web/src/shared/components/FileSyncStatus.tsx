import { useState } from 'react'
import { HardDrive, HardDriveDownload, Unplug, Check, AlertTriangle } from 'lucide-react'
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
} from '@/shared/ui/alert-dialog'
import { useSettingsStore } from '@/shared/stores/settingsStore'
import { useClientStore } from '@/modules/clients'
import { useDriverStore } from '@/modules/drivers'
import { useRouteStore } from '@/modules/routes'
import type { Client } from '@/modules/clients'
import type { Driver } from '@/modules/drivers'
import type { DayRoute } from '@/modules/routes'
import {
  isFileSyncSupported,
  pickSaveFile,
  pickOpenFile,
  getSavedHandle,
  requestPermission,
  writeToFile,
  readFromFile,
  clearSavedHandle,
  type FileSyncData,
} from '@/shared/lib/filesync'
import { setFileSyncHandle } from '@/shared/hooks/useFileSync'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function FileSyncStatus() {
  const fileSyncEnabled = useSettingsStore((s) => s.fileSyncEnabled)
  const fileSyncFileName = useSettingsStore((s) => s.fileSyncFileName)
  const lastFileSyncAt = useSettingsStore((s) => s.lastFileSyncAt)
  const setFileSyncEnabled = useSettingsStore((s) => s.setFileSyncEnabled)
  const setFileSyncFileName = useSettingsStore((s) => s.setFileSyncFileName)
  const setLastFileSyncAt = useSettingsStore((s) => s.setLastFileSyncAt)

  const [restoreData, setRestoreData] = useState<FileSyncData | null>(null)

  if (!isFileSyncSupported()) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-400">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span>Автосохранение на диск недоступно в этом браузере</span>
      </div>
    )
  }

  async function handleSetup() {
    const handle = await pickSaveFile()
    if (!handle) return

    // Write current data immediately
    const data: FileSyncData = {
      version: 1,
      timestamp: new Date().toISOString(),
      clients: useClientStore.getState().clients,
      routes: useRouteStore.getState().routes,
      drivers: useDriverStore.getState().drivers,
    }

    const ok = await writeToFile(handle, data)
    if (ok) {
      setFileSyncEnabled(true)
      setFileSyncFileName(handle.name)
      setLastFileSyncAt(data.timestamp)
      setFileSyncHandle(handle)
      toast.success('Автосохранение на диск подключено')
    } else {
      toast.error('Не удалось записать файл')
    }
  }

  async function handleReconnect() {
    const handle = await getSavedHandle()
    if (!handle) {
      toast.error('Файл не найден. Выберите заново.')
      return
    }

    const granted = await requestPermission(handle)
    if (!granted) {
      toast.error('Нет разрешения на запись')
      return
    }

    setFileSyncHandle(handle)
    setFileSyncFileName(handle.name)
    toast.success('Файл переподключён')
  }

  async function handleDisconnect() {
    setFileSyncEnabled(false)
    setFileSyncFileName('')
    setLastFileSyncAt(null)
    setFileSyncHandle(null)
    await clearSavedHandle()
    toast.success('Автосохранение отключено')
  }

  async function handleRestore() {
    const handle = await pickOpenFile()
    if (!handle) return

    const data = await readFromFile(handle)
    if (!data) {
      toast.error('Не удалось прочитать файл или неверный формат')
      return
    }
    setRestoreData(data)
  }

  function confirmRestore() {
    if (!restoreData) return
    useClientStore.getState().seedClients(restoreData.clients as Client[])
    useRouteStore.getState().seedRoutes(restoreData.routes as DayRoute[])
    useDriverStore.getState().seedDrivers(restoreData.drivers as Driver[])
    setRestoreData(null)
    toast.success('Данные восстановлены из файла')
  }

  if (!fileSyncEnabled) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSetup}>
            <HardDrive className="h-4 w-4" />
            Подключить автосохранение
          </Button>
          <Button variant="outline" size="sm" onClick={handleRestore}>
            <HardDriveDownload className="h-4 w-4" />
            Восстановить из файла
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Данные будут автоматически сохраняться на диск при каждом изменении
        </p>

        <AlertDialog open={!!restoreData} onOpenChange={(open) => !open && setRestoreData(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Восстановить данные?</AlertDialogTitle>
              <AlertDialogDescription>
                Текущие данные будут заменены данными из файла
                {restoreData?.timestamp && ` (сохранено ${formatTime(restoreData.timestamp)})`}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRestore}>Восстановить</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-sm text-emerald-400">
          <Check className="h-3.5 w-3.5" />
          <span className="truncate max-w-40">{fileSyncFileName}</span>
        </div>
        {lastFileSyncAt && (
          <span className="text-sm text-muted-foreground">
            {formatTime(lastFileSyncAt)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleReconnect} className="h-7 text-sm">
          Переподключить
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDisconnect} className="h-7 text-sm text-muted-foreground">
          <Unplug className="h-3.5 w-3.5" />
          Отключить
        </Button>
      </div>
    </div>
  )
}
