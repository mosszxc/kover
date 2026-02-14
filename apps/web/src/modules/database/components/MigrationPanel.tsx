import { useState, useCallback } from 'react'
import { Database, CheckCircle2, AlertCircle, Loader2, Upload } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import type { MigrationResult, MigrationCollectionResult } from '@/shared/lib/sync'

type MigrationStatus = 'idle' | 'running' | 'done' | 'error'

interface MigrationPanelProps {
  isMigrated: boolean
  onMigrate: (
    onProgress: (current: MigrationCollectionResult, index: number, total: number) => void,
  ) => Promise<MigrationResult>
}

const COLLECTION_LABELS: Record<string, string> = {
  mat_sizes: 'Размеры ковриков',
  settings: 'Настройки',
  drivers: 'Водители',
  clients: 'Клиенты',
  changelog: 'Журнал изменений',
  day_routes: 'Дневные маршруты',
  route_stops: 'Остановки маршрутов',
}

export function MigrationPanel({ isMigrated, onMigrate }: MigrationPanelProps) {
  const [status, setStatus] = useState<MigrationStatus>(isMigrated ? 'done' : 'idle')
  const [result, setResult] = useState<MigrationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentCollection, setCurrentCollection] = useState<string | null>(null)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const handleMigrate = useCallback(async () => {
    setStatus('running')
    setError(null)
    setResult(null)

    try {
      const migrationResult = await onMigrate((cur, index, total) => {
        setCurrentCollection(cur.collection)
        setProgress({ current: index + 1, total })
      })
      setResult(migrationResult)
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
      setStatus('error')
    }
  }, [onMigrate])

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
          <Database className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-foreground">Миграция в PocketBase</h2>
          <p className="text-xs text-muted-foreground">
            Одноразовая загрузка данных из localStorage в PocketBase
          </p>
        </div>
      </div>

      {status === 'idle' && (
        <Button onClick={handleMigrate} className="gap-2">
          <Upload className="h-4 w-4" />
          Загрузить данные в PocketBase
        </Button>
      )}

      {status === 'running' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>
              Загрузка {progress.current}/{progress.total}
              {currentCollection && ` — ${COLLECTION_LABELS[currentCollection] ?? currentCollection}`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: progress.total ? `${(progress.current / progress.total) * 100}%` : '0%' }}
            />
          </div>
        </div>
      )}

      {status === 'done' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-500">
            <CheckCircle2 className="h-4 w-4" />
            <span>Данные загружены в PocketBase</span>
          </div>
          {result && (
            <div className="space-y-1">
              {result.collections
                .filter((c) => c.total > 0)
                .map((c) => (
                  <div key={c.collection} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {COLLECTION_LABELS[c.collection] ?? c.collection}
                    </span>
                    <span className="text-foreground">
                      {c.created > 0 && <span className="text-green-500">{c.created} создано</span>}
                      {c.skipped > 0 && (
                        <span className="text-muted-foreground ml-2">{c.skipped} пропущено</span>
                      )}
                      {c.failed > 0 && <span className="text-red-500 ml-2">{c.failed} ошибок</span>}
                    </span>
                  </div>
                ))}
              <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-sm font-medium">
                <span className="text-muted-foreground">Итого</span>
                <span className="text-foreground">
                  {result.totalCreated} создано
                  {result.totalSkipped > 0 && `, ${result.totalSkipped} пропущено`}
                  {result.totalFailed > 0 && `, ${result.totalFailed} ошибок`}
                </span>
              </div>
            </div>
          )}
          {!result && (
            <p className="text-xs text-muted-foreground">Миграция была выполнена ранее</p>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <Button onClick={handleMigrate} variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Повторить
          </Button>
        </div>
      )}
    </div>
  )
}
