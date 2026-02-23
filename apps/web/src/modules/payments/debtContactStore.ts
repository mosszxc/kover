import { create } from 'zustand'
import { supabaseSync } from '@/shared/lib/sync/supabaseSync'
import { debtContactsAdapter } from '@/shared/lib/sync/adapters'

export type DebtContactStatus = 'not_contacted' | 'reminded' | 'promised' | 'problematic'

export interface DebtContactNote {
  id: string
  text: string
  createdAt: string
}

export interface DebtContact {
  id: string
  clientId: string
  status: DebtContactStatus
  lastContactedAt: string | null
  notes: DebtContactNote[]
  updatedAt: string
}

export const DEBT_CONTACT_STATUS_CONFIG: Record<
  DebtContactStatus,
  { label: string; className: string }
> = {
  not_contacted: { label: 'Не связывались', className: 'bg-muted text-muted-foreground' },
  reminded: { label: 'Напомнили', className: 'bg-blue-600/20 text-blue-400' },
  promised: { label: 'Обещал', className: 'bg-amber-600/20 text-amber-400' },
  problematic: { label: 'Проблемный', className: 'bg-red-600/20 text-red-400' },
}

interface DebtContactState {
  contacts: DebtContact[]
  getContact: (clientId: string) => DebtContact | undefined
  setStatus: (clientId: string, status: DebtContactStatus) => void
  addNote: (clientId: string, note: DebtContactNote) => void
  deleteNote: (clientId: string, noteId: string) => void
}

function ensureContact(contacts: DebtContact[], clientId: string): DebtContact[] {
  if (contacts.find((c) => c.clientId === clientId)) return contacts
  return [
    ...contacts,
    {
      id: crypto.randomUUID(),
      clientId,
      status: 'not_contacted',
      lastContactedAt: null,
      notes: [],
      updatedAt: new Date().toISOString(),
    },
  ]
}

export const useDebtContactStore = create<DebtContactState>()(
  supabaseSync(
    {
      adapter: debtContactsAdapter,
      getItems: (state: DebtContactState) => state.contacts,
      itemsKey: 'contacts',
    },
    (set, get) => ({
      contacts: [],

      getContact: (clientId) => get().contacts.find((c) => c.clientId === clientId),

      setStatus: (clientId, status) =>
        set((state) => {
          const contacts = ensureContact(state.contacts, clientId)
          const now = new Date().toISOString()
          return {
            contacts: contacts.map((c) =>
              c.clientId === clientId
                ? {
                    ...c,
                    status,
                    lastContactedAt: status !== 'not_contacted' ? now : c.lastContactedAt,
                    updatedAt: now,
                  }
                : c,
            ),
          }
        }),

      addNote: (clientId, note) =>
        set((state) => {
          const contacts = ensureContact(state.contacts, clientId)
          const now = new Date().toISOString()
          return {
            contacts: contacts.map((c) =>
              c.clientId === clientId
                ? {
                    ...c,
                    notes: [note, ...c.notes],
                    lastContactedAt: now,
                    updatedAt: now,
                  }
                : c,
            ),
          }
        }),

      deleteNote: (clientId, noteId) =>
        set((state) => ({
          contacts: state.contacts.map((c) =>
            c.clientId === clientId
              ? {
                  ...c,
                  notes: c.notes.filter((n) => n.id !== noteId),
                  updatedAt: new Date().toISOString(),
                }
              : c,
          ),
        })),
    }),
  ),
)
