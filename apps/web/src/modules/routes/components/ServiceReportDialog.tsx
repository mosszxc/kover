import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useServiceReportStore } from '@/shared/stores/serviceReportStore'
import type { MatCount } from '@/shared/stores/serviceReportStore'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'
import type { DayOfWeek } from '@/shared/types'

interface MatSpec {
  size: string
  quantity: number
}

interface ServiceReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
  mats: MatSpec[]
  day: DayOfWeek
  onDiscrepancy?: (sizeId: string, shortage: number) => void
}

export function ServiceReportDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  mats,
  day,
  onDiscrepancy,
}: ServiceReportDialogProps) {
  const addReport = useServiceReportStore((s) => s.addReport)
  const sizes = useMatSizeStore((s) => s.sizes)
  const labelMap = useMemo(
    () => Object.fromEntries(sizes.map((s) => [s.id, s.label])),
    [sizes],
  )

  const grouped = useMemo(() => {
    const map = new Map<string, number>()
    for (const m of mats) {
      map.set(m.size, (map.get(m.size) ?? 0) + m.quantity)
    }
    return Array.from(map.entries()).map(([sizeId, qty]) => ({
      sizeId,
      expected: qty,
    }))
  }, [mats])

  const [counts, setCounts] = useState<Record<string, { pickedUp: string; delivered: string }>>(
    () => Object.fromEntries(grouped.map((g) => [g.sizeId, { pickedUp: String(g.expected), delivered: String(g.expected) }])),
  )
  const [notes, setNotes] = useState('')

  const discrepancies = useMemo(() => {
    return grouped.filter((g) => {
      const c = counts[g.sizeId]
      if (!c) return false
      const pickedUp = parseInt(c.pickedUp, 10) || 0
      const delivered = parseInt(c.delivered, 10) || 0
      return pickedUp !== g.expected || delivered !== g.expected
    })
  }, [grouped, counts])

  function handleSubmit() {
    const matCounts: MatCount[] = grouped.map((g) => {
      const c = counts[g.sizeId]
      return {
        sizeId: g.sizeId,
        expected: g.expected,
        pickedUp: parseInt(c?.pickedUp ?? '0', 10) || 0,
        delivered: parseInt(c?.delivered ?? '0', 10) || 0,
      }
    })

    const hasDiscrepancy = matCounts.some(
      (m) => m.pickedUp !== m.expected || m.delivered !== m.expected,
    )

    addReport({
      id: crypto.randomUUID(),
      clientId,
      day,
      date: new Date().toISOString().split('T')[0] ?? '',
      mats: matCounts,
      hasDiscrepancy,
      notes,
      createdAt: new Date().toISOString(),
    })

    if (hasDiscrepancy && onDiscrepancy) {
      for (const m of matCounts) {
        const shortage = m.expected - m.pickedUp
        if (shortage > 0) {
          onDiscrepancy(m.sizeId, shortage)
        }
      }
    }

    toast.success(hasDiscrepancy ? 'Отчёт сохранён (есть расхождения)' : 'Отчёт сохранён')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Отчёт о визите</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Клиент</p>
            <p className="font-medium">{clientName}</p>
          </div>

          <div className="space-y-3">
            {grouped.map((g) => {
              const c = counts[g.sizeId]
              const pickedUp = parseInt(c?.pickedUp ?? '0', 10) || 0
              const delivered = parseInt(c?.delivered ?? '0', 10) || 0
              const hasIssue = pickedUp !== g.expected || delivered !== g.expected

              return (
                <div key={g.sizeId} className={cn('rounded-lg border p-3', hasIssue && 'border-amber-500/40 bg-amber-500/5')}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{labelMap[g.sizeId] ?? g.sizeId}</span>
                    <span className="text-sm text-muted-foreground">Должно быть: {g.expected} шт</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Забрано</label>
                      <input
                        type="number"
                        min={0}
                        value={c?.pickedUp ?? ''}
                        onChange={(e) => setCounts((prev) => ({
                          ...prev,
                          [g.sizeId]: { ...prev[g.sizeId]!, pickedUp: e.target.value },
                        }))}
                        className="w-full rounded border border-border bg-card px-2 py-1.5 text-sm tabular-nums focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Оставлено</label>
                      <input
                        type="number"
                        min={0}
                        value={c?.delivered ?? ''}
                        onChange={(e) => setCounts((prev) => ({
                          ...prev,
                          [g.sizeId]: { ...prev[g.sizeId]!, delivered: e.target.value },
                        }))}
                        className="w-full rounded border border-border bg-card px-2 py-1.5 text-sm tabular-nums focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                      />
                    </div>
                  </div>
                  {hasIssue && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
                      <AlertTriangle className="size-3" />
                      Расхождение с ожидаемым
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="report-notes" className="text-sm text-muted-foreground">
              Заметка
            </label>
            <input
              id="report-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Коврик порван, клиент потерял..."
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
            />
          </div>

          {discrepancies.length > 0 && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
              <p className="text-sm font-medium text-amber-400">
                {discrepancies.length} расхождени{discrepancies.length === 1 ? 'е' : 'я'}
              </p>
              <p className="text-xs text-muted-foreground">
                Недостачи будут списаны из инвентаря
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit}>
            Сохранить отчёт
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
