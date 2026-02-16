import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { temporal } from 'zundo'
import type { Client, ClientNote } from './types'
import { supabaseSync, clientsAdapter } from '@/shared/lib/sync'
import { generateId } from '@/shared/lib/generateId'

interface ClientState {
  clients: Client[]
  addClient: (client: Client) => void
  updateClient: (id: string, data: Partial<Client>) => void
  deleteClient: (id: string) => void
  addNote: (clientId: string, text: string) => void
  deleteNote: (clientId: string, noteId: string) => void
  seedClients: (clients: Client[]) => void
}

export const useClientStore = create<ClientState>()(
  persist(
    temporal(
      supabaseSync(
        {
          adapter: clientsAdapter,
          getItems: (state) => (state as ClientState).clients,
          itemsKey: 'clients',
        },
      (set) => ({
        clients: [],

        addClient: (client) =>
          set((state) => ({ clients: [...state.clients, client] })),

        updateClient: (id, data) =>
          set((state) => ({
            clients: state.clients.map((c) =>
              c.id === id ? { ...c, ...data } : c,
            ),
          })),

        deleteClient: (id) =>
          set((state) => ({
            clients: state.clients.filter((c) => c.id !== id),
          })),

        addNote: (clientId, text) =>
          set((state) => ({
            clients: state.clients.map((c) => {
              if (c.id !== clientId) return c
              const note: ClientNote = {
                id: generateId(),
                text,
                createdAt: new Date().toISOString(),
              }
              return { ...c, clientNotes: [note, ...(c.clientNotes ?? [])] }
            }),
          })),

        deleteNote: (clientId, noteId) =>
          set((state) => ({
            clients: state.clients.map((c) => {
              if (c.id !== clientId) return c
              return { ...c, clientNotes: (c.clientNotes ?? []).filter((n) => n.id !== noteId) }
            }),
          })),

        seedClients: (clients) => set({ clients }),
      }),
      ),
      {
        limit: 20,
        partialize: (state) => {
          const { clients } = state
          return { clients } as ClientState
        },
      },
    ),
    { name: 'kover-clients', version: 1 },
  ),
)
