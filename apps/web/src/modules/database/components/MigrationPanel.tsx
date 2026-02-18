import { useState } from 'react'
import { Upload, RefreshCw, CheckCircle2, XCircle, Loader2, Cloud } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { isSupabaseConfigured } from '@/shared/lib/supabase'
import { migrateToSupabase } from '@/shared/lib/sync'
import type { MigrationProgress } from '@/shared/lib/sync'
import type { LocalData } from '@/shared/lib/sync'

interface MigrationPanelProps {
  getLocalData: () => LocalData
}

export function MigrationPanel({ getLocalData }: MigrationPanelProps) {
  const [progress, setProgress] = useState<MigrationProgress[] | null>(null)
  const [migrating, setMigrating] = useState(false)
  const [result, setResult] = useState<{ success: boolean } | null>(null)

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Cloud className="h-5 w-5" />
          <div>
            <p className="text-sm font-medium">Supabase не настроен</p>
            <p className="text-sm">
              Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env
            </p>
          </div>
        </div>
      </div>
    )
  }

  const handleMigrate = async () => {
    setMigrating(true)
    setResult(null)
    setProgress(null)

    const data = getLocalData()
    const res = await migrateToSupabase(data, setProgress)

    setResult({ success: res.success })
    setMigrating(false)
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-foreground">
            Синхронизация с Supabase
          </h2>
          <p className="text-sm text-muted-foreground">
            Загрузка данных из localStorage в облако
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleMigrate}
            disabled={migrating}
            variant={result?.success ? 'outline' : 'default'}
            className="gap-2"
          >
            {migrating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : result ? (
              <RefreshCw className="h-4 w-4" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {migrating
              ? 'Загрузка...'
              : result
                ? 'Актуализировать'
                : 'Загрузить в Supabase'}
          </Button>
        </div>
      </div>

      {progress && (
        <div className="space-y-2">
          {progress.map((p) => (
            <div
              key={p.table}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                {p.status === 'syncing' && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                )}
                {p.status === 'done' && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                )}
                {p.status === 'error' && (
                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                )}
                {p.status === 'pending' && (
                  <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground" />
                )}
                <span className="text-foreground">{p.table}</span>
              </div>
              <span className="text-muted-foreground tabular-nums">
                {p.status === 'done'
                  ? `${p.done} записей`
                  : p.status === 'error'
                    ? p.error ?? 'ошибка'
                    : `${p.total} записей`}
              </span>
            </div>
          ))}
        </div>
      )}

      {result && !migrating && (
        <div
          className={`rounded-md p-3 text-sm ${
            result.success
              ? 'bg-green-500/10 text-green-500'
              : 'bg-red-500/10 text-red-500'
          }`}
        >
          {result.success
            ? 'Данные успешно загружены в Supabase'
            : 'Некоторые таблицы не удалось загрузить. Проверьте консоль.'}
        </div>
      )}
    </div>
  )
}
