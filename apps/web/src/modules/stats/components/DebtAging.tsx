import { useState } from 'react'
import {
  AlertTriangle,
  Clock,
  MessageSquarePlus,
  Phone,
  TrendingDown,
  Trash2,
  User,
} from 'lucide-react'
import { useDebtAging } from '../hooks/useDebtAging'
import type { TopDebtor } from '../hooks/useDebtAging'
import {
  useDebtContactStore,
  DEBT_CONTACT_STATUS_CONFIG,
} from '@/modules/payments'
import type { DebtContactStatus } from '@/modules/payments'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'

const STALE_CONTACT_DAYS = 7

function DebtorContactRow({ debtor }: { debtor: TopDebtor }) {
  const { setStatus, addNote, deleteNote } = useDebtContactStore()
  const [noteText, setNoteText] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  const statusConfig = DEBT_CONTACT_STATUS_CONFIG[debtor.contactStatus]
  const isStale =
    debtor.contactStatus === 'not_contacted' ||
    (debtor.daysSinceContact !== null && debtor.daysSinceContact >= STALE_CONTACT_DAYS)

  const handleAddNote = () => {
    const trimmed = noteText.trim()
    if (!trimmed) return
    addNote(debtor.clientId, {
      id: crypto.randomUUID(),
      text: trimmed,
      createdAt: new Date().toISOString(),
    })
    setNoteText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddNote()
    }
  }

  return (
    <div
      className={`rounded-md border px-3 py-2 ${
        isStale
          ? 'border-amber-500/50 bg-amber-500/5'
          : 'border-border bg-card/50'
      }`}
    >
      {/* Main row */}
      <div className="flex items-center gap-2">
        <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm text-foreground">
          {debtor.clientName}
        </span>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-red-400">
          {debtor.totalDebt.toLocaleString('ru-RU')} ₽
        </span>
        {debtor.oldestDays >= 60 && (
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400" />
        )}
      </div>

      {/* Contact status row */}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {/* Status selector */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button">
              <Badge
                variant="secondary"
                className={`cursor-pointer text-[10px] ${statusConfig.className}`}
              >
                {statusConfig.label}
              </Badge>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1" align="start">
            {(Object.entries(DEBT_CONTACT_STATUS_CONFIG) as [DebtContactStatus, { label: string; className: string }][]).map(
              ([key, config]) => (
                <button
                  key={key}
                  type="button"
                  className={`flex w-full items-center rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent ${
                    debtor.contactStatus === key ? 'bg-accent' : ''
                  }`}
                  onClick={() => setStatus(debtor.clientId, key)}
                >
                  <Badge variant="secondary" className={`text-[10px] ${config.className}`}>
                    {config.label}
                  </Badge>
                </button>
              ),
            )}
          </PopoverContent>
        </Popover>

        {/* Last contacted */}
        {debtor.lastContactedAt && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Phone className="h-3 w-3" />
            {debtor.daysSinceContact === 0
              ? 'сегодня'
              : debtor.daysSinceContact === 1
                ? 'вчера'
                : `${debtor.daysSinceContact} дн. назад`}
          </span>
        )}

        {/* Stale warning */}
        {isStale && (
          <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
            <Clock className="h-3 w-3" />
            {debtor.contactStatus === 'not_contacted' ? 'Не связывались' : 'Давно не связывались'}
          </span>
        )}

        {/* Notes toggle */}
        <button
          type="button"
          onClick={() => setShowNotes(!showNotes)}
          className="ml-auto flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
        >
          <MessageSquarePlus className="h-3 w-3" />
          {debtor.contactNotes.length > 0 && (
            <span className="tabular-nums">{debtor.contactNotes.length}</span>
          )}
        </button>
      </div>

      {/* Notes section */}
      {showNotes && (
        <div className="mt-2 space-y-1.5 border-t border-border pt-2">
          {/* Add note input */}
          <div className="flex gap-1">
            <Input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Заметка..."
              className="h-7 text-xs"
            />
            <Button
              size="sm"
              variant="secondary"
              className="h-7 px-2 text-xs"
              onClick={handleAddNote}
              disabled={!noteText.trim()}
            >
              +
            </Button>
          </div>

          {/* Notes list */}
          {debtor.contactNotes.map((note) => (
            <div
              key={note.id}
              className="group flex items-start gap-1.5 text-xs text-muted-foreground"
            >
              <span className="shrink-0 tabular-nums text-[10px]">
                {new Date(note.createdAt).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
              <span className="flex-1 text-foreground">{note.text}</span>
              <button
                type="button"
                onClick={() => deleteNote(debtor.clientId, note.id)}
                className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-400" />
              </button>
            </div>
          ))}

          {debtor.contactNotes.length === 0 && (
            <p className="text-[10px] text-muted-foreground">Нет заметок</p>
          )}
        </div>
      )}
    </div>
  )
}

export function DebtAging() {
  const { totalDebt, totalDebtors, buckets, topDebtors } = useDebtAging()

  if (totalDebtors === 0) {
    return (
      <div className="rounded-lg border border-border bg-card/50 p-4 text-center text-sm text-muted-foreground">
        Нет просроченных оплат
      </div>
    )
  }

  const maxBucketDebt = Math.max(...buckets.map((b) => b.totalDebt), 1)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <TrendingDown className="h-4 w-4 text-red-400" />
          Дебиторская задолженность
        </h3>
        <div className="text-right">
          <p className="text-lg font-bold tabular-nums text-red-400">
            {totalDebt.toLocaleString('ru-RU')} ₽
          </p>
          <p className="text-sm text-muted-foreground">
            {totalDebtors} должник{totalDebtors === 1 ? '' : totalDebtors < 5 ? 'а' : 'ов'}
          </p>
        </div>
      </div>

      {/* Aging buckets */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">По срокам</p>
        {buckets.map((bucket) => (
          <div key={bucket.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{bucket.label}</span>
              <span className="tabular-nums text-foreground">
                {bucket.totalDebt > 0
                  ? `${bucket.totalDebt.toLocaleString('ru-RU')} ₽ (${bucket.clientCount})`
                  : '—'}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  bucket.label.includes('90')
                    ? 'bg-red-500'
                    : bucket.label.includes('60')
                      ? 'bg-orange-500'
                      : bucket.label.includes('30')
                        ? 'bg-amber-500'
                        : 'bg-yellow-500'
                }`}
                style={{ width: `${(bucket.totalDebt / maxBucketDebt) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Top debtors with contact workflow */}
      {topDebtors.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Топ должников</p>
          <div className="space-y-1.5">
            {topDebtors.map((debtor) => (
              <DebtorContactRow key={debtor.clientId} debtor={debtor} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
