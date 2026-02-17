import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
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
import type { BackupData } from '@/shared/lib/backup'
import { collectStores, restoreStores } from '@/shared/lib/backupStores'

function validateBackup(data: unknown): data is BackupData {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  // Core fields required; rest optional for backward compat with old backups
  return Array.isArray(obj.clients) && Array.isArray(obj.routes)
}

export function JsonBackup() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingData, setPendingData] = useState<BackupData | null>(null)

  const handleExport = () => {
    const stores = collectStores()
    const json = JSON.stringify(stores, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const date = new Date().toISOString().slice(0, 10)
    const a = document.createElement('a')
    a.href = url
    a.download = `kover-backup-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Копия сохранена')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        if (!validateBackup(parsed)) {
          toast.error('Неверный формат файла')
          return
        }
        setPendingData(parsed)
      } catch {
        toast.error('Не удалось прочитать файл')
      }
    }
    reader.readAsText(file)

    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleConfirmRestore = () => {
    if (!pendingData) return
    restoreStores(pendingData as BackupData)
    setPendingData(null)
    toast.success('Данные восстановлены')
  }

  return (
    <div className="flex gap-3">
      <Button variant="outline" onClick={handleExport}>
        <Download />
        Сохранить копию
      </Button>

      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
        <Upload />
        Загрузить из файла
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      <AlertDialog open={!!pendingData} onOpenChange={(open) => !open && setPendingData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Загрузить данные?</AlertDialogTitle>
            <AlertDialogDescription>
              Текущие данные будут заменены. Продолжить?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRestore}>
              Загрузить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
