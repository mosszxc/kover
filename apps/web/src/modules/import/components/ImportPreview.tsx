import { useState, useCallback } from 'react'
import { Check, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import type { ParsedClient, ParsedMatSpec } from '../types'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'

interface ImportPreviewProps {
  clients: ParsedClient[]
  onConfirm: (clients: ParsedClient[]) => void
  onCancel: () => void
}

function formatMats(mats: ParsedMatSpec[]): string {
  if (mats.length === 0) return ''
  return mats.map((m) => `${m.quantity}×${m.size}`).join(', ')
}

function parseMatsString(str: string): ParsedMatSpec[] | null {
  if (!str.trim()) return []
  const sizeIds = useMatSizeStore.getState().sizes.map((s) => s.id)
  const parts = str.split(',').map((s) => s.trim())
  const result: ParsedMatSpec[] = []
  for (const part of parts) {
    const match = part.match(/^(\d+)\s*[×xхXХ]\s*(.+)$/)
    if (!match || !match[1] || !match[2]) return null
    const size = match[2].trim()
    if (!sizeIds.includes(size)) return null
    result.push({ size, quantity: parseInt(match[1]) })
  }
  return result
}

function EditableCell({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (editing) {
    return (
      <input
        className="w-full rounded bg-muted px-2 py-1 text-sm text-foreground outline-none ring-1 ring-blue-500"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false)
          if (draft !== value) onChange(draft)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setEditing(false)
            if (draft !== value) onChange(draft)
          }
          if (e.key === 'Escape') {
            setEditing(false)
            setDraft(value)
          }
        }}
        autoFocus
      />
    )
  }

  return (
    <span
      className="cursor-pointer rounded px-2 py-1 hover:bg-accent"
      onClick={() => {
        setDraft(value)
        setEditing(true)
      }}
    >
      {value || <span className="italic text-muted-foreground">&mdash;</span>}
    </span>
  )
}

export function ImportPreview({
  clients: initial,
  onConfirm,
  onCancel,
}: ImportPreviewProps) {
  const [clients, setClients] = useState<ParsedClient[]>(initial)

  const updateField = useCallback(
    (index: number, field: keyof ParsedClient, value: string) => {
      setClients((prev) =>
        prev.map((c, i) => {
          if (i !== index) return c
          if (field === 'mats') {
            const parsed = parseMatsString(value)
            if (!parsed) return c
            return { ...c, mats: parsed }
          }
          return { ...c, [field]: value }
        }),
      )
    },
    [],
  )

  const totalCount = clients.length
  const lowCount = clients.filter((c) => c.confidence === 'low').length
  const highCount = totalCount - lowCount

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <span className="text-foreground">
          Распознано:{' '}
          <strong className="text-foreground">{highCount}</strong> из{' '}
          {totalCount}
        </span>
        {lowCount > 0 && (
          <span className="flex items-center gap-1 text-orange-400">
            <AlertTriangle className="h-4 w-4" />
            Требуют проверки: <strong>{lowCount}</strong>
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
              <th className="w-10 px-3 py-2">#</th>
              <th className="min-w-[200px] px-3 py-2">Исходная строка</th>
              <th className="min-w-[150px] px-3 py-2">Название</th>
              <th className="min-w-[150px] px-3 py-2">Адрес</th>
              <th className="min-w-[120px] px-3 py-2">Коврики</th>
              <th className="min-w-[120px] px-3 py-2">Заметки</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client, idx) => (
              <tr
                key={idx}
                className={`border-b border-border/50 ${
                  client.confidence === 'low'
                    ? 'border-l-2 border-l-orange-500 bg-orange-500/10'
                    : 'hover:bg-accent/30'
                }`}
              >
                <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                  {client.originalName}
                </td>
                <td className="px-3 py-2">
                  <EditableCell
                    value={client.name}
                    onChange={(v) => updateField(idx, 'name', v)}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableCell
                    value={client.address}
                    onChange={(v) => updateField(idx, 'address', v)}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableCell
                    value={formatMats(client.mats)}
                    onChange={(v) => updateField(idx, 'mats', v)}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableCell
                    value={client.notes}
                    onChange={(v) => updateField(idx, 'notes', v)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <Button onClick={() => onConfirm(clients)}>
          <Check className="h-4 w-4" />
          Всё верно, импортировать
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4" />
          Отмена
        </Button>
      </div>
    </div>
  )
}
