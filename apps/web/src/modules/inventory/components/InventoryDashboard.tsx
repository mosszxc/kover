import { useState } from 'react'
import { Package, Plus, Minus, AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'
import type { SizeInventorySummary } from '../hooks/useInventorySummary'
import { useInventoryStore } from '../store'
import { TRANSACTION_LABELS } from '../types'
import { StockDialog } from './StockDialog'

interface InventoryDashboardProps {
  summary: SizeInventorySummary[]
  sizeLabels: Map<string, string>
}

export function InventoryDashboard({ summary, sizeLabels }: InventoryDashboardProps) {
  const [stockDialog, setStockDialog] = useState<{ sizeId: string; mode: 'purchase' | 'write_off' } | null>(null)
  const recordPurchase = useInventoryStore((s) => s.recordPurchase)
  const recordWriteOff = useInventoryStore((s) => s.recordWriteOff)
  const transactions = useInventoryStore((s) => s.transactions)

  const recentTransactions = transactions
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 20)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summary.map((item) => (
          <div
            key={item.sizeId}
            className={cn(
              'rounded-lg border p-4',
              item.inStock <= 0 ? 'border-red-500/40 bg-red-500/5' : 'border-border',
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="size-5 text-muted-foreground" />
                <span className="text-lg font-semibold">{sizeLabels.get(item.sizeId) ?? item.sizeId}</span>
              </div>
              {item.inStock <= 0 && (
                <AlertTriangle className="size-5 text-red-400" />
              )}
            </div>

            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Всего в парке</span>
                <span className="font-medium tabular-nums">{item.totalOwned}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">У клиентов</span>
                <span className="tabular-nums">{item.atClients}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">В стирке</span>
                <span className="tabular-nums">{item.inLaundry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Списано</span>
                <span className="tabular-nums">{item.damaged}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1">
                <span className={cn('font-medium', item.inStock <= 0 ? 'text-red-400' : 'text-emerald-400')}>
                  На складе
                </span>
                <span className={cn('font-semibold tabular-nums', item.inStock <= 0 ? 'text-red-400' : 'text-emerald-400')}>
                  {item.inStock}
                </span>
              </div>
            </div>

            {item.totalOwned > 0 && item.batches.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <RotateCw className="size-4" />
                  Износ по партиям
                </div>
                {item.batches.map((batch) => {
                  const pct = Math.min(100, batch.wearPercent)
                  return (
                    <div key={batch.id}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {new Date(batch.purchasedAt).toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' })}
                          {' '}({batch.remaining} шт)
                        </span>
                        <span className={cn(
                          'tabular-nums font-medium',
                          batch.wearPercent >= 100 ? 'text-red-400'
                            : batch.wearPercent >= 80 ? 'text-amber-400'
                            : 'text-muted-foreground',
                        )}>
                          {batch.washCycles}/{batch.maxWashCycles}
                        </span>
                      </div>
                      <div className="mt-0.5 h-1.5 rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            batch.wearPercent >= 100 ? 'bg-red-500'
                              : batch.wearPercent >= 80 ? 'bg-amber-500'
                              : 'bg-emerald-500',
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {batch.wearPercent >= 100 && (
                        <p className="mt-0.5 text-xs text-red-400">Пора менять эту партию!</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            {item.totalOwned > 0 && item.batches.length === 0 && item.maxWashCycles > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <RotateCw className="size-4" />
                    Износ
                  </span>
                  <span className={cn(
                    'tabular-nums font-medium',
                    item.washCycles >= item.maxWashCycles ? 'text-red-400'
                      : item.washCycles >= item.maxWashCycles * 0.8 ? 'text-amber-400'
                      : 'text-muted-foreground',
                  )}>
                    {item.washCycles}/{item.maxWashCycles}
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      item.washCycles >= item.maxWashCycles ? 'bg-red-500'
                        : item.washCycles >= item.maxWashCycles * 0.8 ? 'bg-amber-500'
                        : 'bg-emerald-500',
                    )}
                    style={{ width: `${Math.min(100, (item.washCycles / item.maxWashCycles) * 100)}%` }}
                  />
                </div>
                {item.washCycles >= item.maxWashCycles && (
                  <p className="mt-1 text-xs text-red-400">Пора менять коврики!</p>
                )}
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1"
                onClick={() => setStockDialog({ sizeId: item.sizeId, mode: 'purchase' })}
              >
                <Plus className="size-3" />
                Поступление
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1"
                onClick={() => setStockDialog({ sizeId: item.sizeId, mode: 'write_off' })}
              >
                <Minus className="size-3" />
                Списание
              </Button>
            </div>
          </div>
        ))}
      </div>

      {recentTransactions.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Последние операции</h3>
          <div className="space-y-1">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'rounded px-1.5 py-0.5 text-xs font-semibold',
                    tx.type === 'purchase' ? 'bg-emerald-600/20 text-emerald-400'
                      : tx.type === 'write_off' ? 'bg-red-600/20 text-red-400'
                      : 'bg-blue-600/20 text-blue-400',
                  )}>
                    {TRANSACTION_LABELS[tx.type]}
                  </span>
                  <span>{sizeLabels.get(tx.sizeId) ?? tx.sizeId}</span>
                  <span className="tabular-nums text-muted-foreground">{tx.type === 'write_off' ? '-' : '+'}{tx.quantity} шт</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(tx.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stockDialog && (
        <StockDialog
          open
          onOpenChange={() => setStockDialog(null)}
          sizeId={stockDialog.sizeId}
          sizeLabel={sizeLabels.get(stockDialog.sizeId) ?? stockDialog.sizeId}
          mode={stockDialog.mode}
          onSubmit={(quantity, notes) => {
            if (stockDialog.mode === 'purchase') {
              recordPurchase(stockDialog.sizeId, quantity, notes)
            } else {
              recordWriteOff(stockDialog.sizeId, quantity, notes)
            }
            setStockDialog(null)
          }}
        />
      )}
    </div>
  )
}
