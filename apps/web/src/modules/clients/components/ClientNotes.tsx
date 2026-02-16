import { useState } from 'react'
import { Send, Trash2, StickyNote } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useClientStore } from '../store'
import type { ClientNote } from '../types'

interface ClientNotesProps {
  clientId: string
  notes: ClientNote[]
  pinnedNote?: string
}

function formatNoteDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export function ClientNotes({ clientId, notes, pinnedNote }: ClientNotesProps) {
  const [text, setText] = useState('')
  const addNote = useClientStore((s) => s.addNote)
  const deleteNote = useClientStore((s) => s.deleteNote)

  function handleAdd() {
    const trimmed = text.trim()
    if (!trimmed) return
    addNote(clientId, trimmed)
    setText('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="space-y-4">
      {pinnedNote && (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <StickyNote className="size-3" />
            Постоянная заметка
          </p>
          <p className="whitespace-pre-wrap text-sm text-foreground">{pinnedNote}</p>
        </div>
      )}

      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Новая заметка..."
          rows={2}
          className="flex-1 resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
        />
        <Button
          size="sm"
          disabled={!text.trim()}
          onClick={handleAdd}
          className="self-end"
        >
          <Send className="size-4" />
        </Button>
      </div>

      {notes.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Заметок пока нет
        </p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group rounded-lg border border-border p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="whitespace-pre-wrap text-sm text-foreground">{note.text}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-6 shrink-0 p-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => deleteNote(clientId, note.id)}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{formatNoteDate(note.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
