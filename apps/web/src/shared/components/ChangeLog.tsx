import { MapPin, Users, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useChangeLogStore } from '@/shared/stores/changelogStore'

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'Только что'
  if (diffMin < 60) return `${diffMin} мин назад`

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}ч назад`

  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function ChangeLog() {
  const entries = useChangeLogStore((s) => s.entries)
  const clearEntries = useChangeLogStore((s) => s.clearEntries)

  if (entries.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Лог изменений</h2>
        <p className="text-sm text-muted-foreground">Нет записей. Действия будут записываться автоматически.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Лог изменений</h2>
        <Button variant="ghost" size="sm" onClick={clearEntries}>
          <Trash2 className="h-3.5 w-3.5" />
          Очистить
        </Button>
      </div>
      <div className="space-y-1">
        {entries.slice(0, 50).map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-3 rounded-md px-3 py-2 hover:bg-accent/50"
          >
            <div className="mt-0.5 shrink-0">
              {entry.type === 'route' ? (
                entry.action === 'reorder' ? (
                  <RotateCcw className="h-4 w-4 text-blue-400" />
                ) : (
                  <MapPin className="h-4 w-4 text-blue-400" />
                )
              ) : (
                <Users className="h-4 w-4 text-emerald-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">{entry.description}</p>
            </div>
            <span className="shrink-0 text-sm text-muted-foreground">
              {formatTime(entry.timestamp)}
            </span>
          </div>
        ))}
      </div>
      {entries.length > 50 && (
        <p className="text-center text-sm text-muted-foreground">
          Показано 50 из {entries.length} записей
        </p>
      )}
    </div>
  )
}
