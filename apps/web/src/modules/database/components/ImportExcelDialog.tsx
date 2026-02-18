import { useState, useRef, useCallback } from 'react'
import { Upload, AlertTriangle, Plus, Pencil, Trash2, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/shared/ui/dialog'
import { parseExcelImport, computeDiff, applyImport } from '../lib/importExcel'
import type { ImportData, ImportDiff, ImportError } from '../lib/importExcel'
import type { Client } from '@/modules/clients'
import type { Driver } from '@/modules/drivers'
import type { DayRoute } from '@/modules/routes'
import type { MatSizeConfig } from '@/shared/types'

type Step = 'idle' | 'preview' | 'errors'

interface ImportExcelDialogProps {
  currentClients: Client[]
  currentDrivers: Driver[]
  currentRoutes: DayRoute[]
  currentMatSizes: MatSizeConfig[]
  onApply: (data: ImportData) => void
}

export function ImportExcelDialog({
  currentClients,
  currentDrivers,
  currentRoutes,
  currentMatSizes,
  onApply,
}: ImportExcelDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('idle')
  const [diff, setDiff] = useState<ImportDiff | null>(null)
  const [importData, setImportData] = useState<ImportData | null>(null)
  const [errors, setErrors] = useState<ImportError[]>([])
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setStep('idle')
    setDiff(null)
    setImportData(null)
    setErrors([])
    setFileName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name)
    const buffer = await file.arrayBuffer()
    const result = parseExcelImport(buffer)

    setImportData(result.data)
    const diffResult = computeDiff(result.data, {
      clients: currentClients,
      drivers: currentDrivers,
      routes: currentRoutes,
      matSizes: currentMatSizes,
    })
    setDiff(diffResult)

    if (result.errors.length > 0) {
      setErrors(result.errors)
      setStep('errors')
    } else {
      setStep('preview')
    }
  }, [currentClients, currentDrivers, currentRoutes, currentMatSizes])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleApply = useCallback(() => {
    if (!importData) return
    const final = applyImport(importData, currentClients, currentDrivers)
    onApply(final)
    setOpen(false)
    reset()
  }, [importData, currentClients, currentDrivers, onApply, reset])

  const handleOpenChange = useCallback((value: boolean) => {
    setOpen(value)
    if (!value) reset()
  }, [reset])

  const totalChanges = diff
    ? diff.clients.added.length + diff.clients.changed.length + diff.clients.removed.length +
      diff.drivers.added.length + diff.drivers.changed.length + diff.drivers.removed.length +
      diff.matSizes.added.length + diff.matSizes.changed.length + diff.matSizes.removed.length +
      diff.routes.addedStops + diff.routes.removedStops
    : 0

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Upload className="h-4 w-4" />
        Загрузить из Excel
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Загрузить из Excel</DialogTitle>
            <DialogDescription>
              Загрузите файл в формате экспорта (.xlsx)
            </DialogDescription>
          </DialogHeader>

          {step === 'idle' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Выберите .xlsx файл, выгруженный через «Выгрузить в Excel»
              </p>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Выбрать файл
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {step === 'errors' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Ошибки парсинга</span>
              </div>
              <div className="max-h-40 overflow-y-auto rounded border border-border p-3 text-sm">
                {errors.map((err, i) => (
                  <p key={i} className="text-muted-foreground">
                    <span className="font-medium">{err.sheet}</span>, строка {err.row}: {err.message}
                  </p>
                ))}
              </div>
              {importData && diff && (
                <Button variant="outline" onClick={() => setStep('preview')} className="w-full">
                  Всё равно показать превью ({errors.length} ошибок пропущено)
                </Button>
              )}
              <Button variant="outline" onClick={reset} className="w-full">
                Выбрать другой файл
              </Button>
            </div>
          )}

          {step === 'preview' && diff && (
            <div className="space-y-4">
              {fileName && (
                <p className="text-sm text-muted-foreground">Файл: {fileName}</p>
              )}

              {errors.length > 0 && (
                <button
                  onClick={() => setStep('errors')}
                  className="flex items-center gap-1.5 text-sm text-amber-500 hover:underline"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {errors.length} ошибок парсинга (пропущено)
                </button>
              )}

              <DiffSection title="Клиенты" diff={diff.clients} />
              <DiffSection title="Водители" diff={diff.drivers} />
              <DiffSection title="Размеры ковриков" diff={diff.matSizes} />
              <RouteDiffSection diff={diff.routes} />

              {totalChanges === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Изменений не найдено — данные совпадают
                </p>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={reset}>
                  Отмена
                </Button>
                <Button onClick={handleApply} disabled={totalChanges === 0}>
                  Применить изменения
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function DiffSection<T extends { name?: string; label?: string; id?: string }>({
  title,
  diff,
}: {
  title: string
  diff: { added: T[]; changed: { old: T; new: T }[]; removed: T[]; unchanged: number }
}) {
  const hasChanges = diff.added.length > 0 || diff.changed.length > 0 || diff.removed.length > 0

  return (
    <div className="rounded border border-border p-3">
      <h3 className="mb-2 text-sm font-medium text-foreground">{title}</h3>
      {!hasChanges ? (
        <p className="text-sm text-muted-foreground">Без изменений ({diff.unchanged})</p>
      ) : (
        <div className="space-y-1 text-sm">
          {diff.added.map((item, i) => (
            <div key={`a-${i}`} className="flex items-center gap-1.5 text-green-500">
              <Plus className="h-3 w-3" />
              {getName(item)}
            </div>
          ))}
          {diff.changed.map((item, i) => (
            <div key={`c-${i}`} className="flex items-center gap-1.5 text-amber-500">
              <Pencil className="h-3 w-3" />
              {getName(item.new)}
            </div>
          ))}
          {diff.removed.map((item, i) => (
            <div key={`r-${i}`} className="flex items-center gap-1.5 text-red-500">
              <Trash2 className="h-3 w-3" />
              {getName(item)}
            </div>
          ))}
          {diff.unchanged > 0 && (
            <p className="text-muted-foreground">Без изменений: {diff.unchanged}</p>
          )}
        </div>
      )}
    </div>
  )
}

function getName(item: { name?: string; label?: string; id?: string }): string {
  return item.name ?? item.label ?? item.id ?? '—'
}

function RouteDiffSection({ diff }: { diff: ImportDiff['routes'] }) {
  const hasChanges = diff.addedStops > 0 || diff.removedStops > 0

  return (
    <div className="rounded border border-border p-3">
      <h3 className="mb-2 text-sm font-medium text-foreground">Маршруты</h3>
      {!hasChanges ? (
        <p className="text-sm text-muted-foreground">Без изменений ({diff.unchangedStops} остановок)</p>
      ) : (
        <div className="space-y-1 text-sm">
          {diff.addedStops > 0 && (
            <div className="flex items-center gap-1.5 text-green-500">
              <Plus className="h-3 w-3" />
              {diff.addedStops} новых остановок
            </div>
          )}
          {diff.removedStops > 0 && (
            <div className="flex items-center gap-1.5 text-red-500">
              <Trash2 className="h-3 w-3" />
              {diff.removedStops} удалённых остановок
            </div>
          )}
          {diff.unchangedStops > 0 && (
            <p className="text-muted-foreground">Без изменений: {diff.unchangedStops}</p>
          )}
        </div>
      )}
    </div>
  )
}
