import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { temporal } from 'zundo'
import type { Client } from './types'

interface ClientState {
  clients: Client[]
  addClient: (client: Client) => void
  updateClient: (id: string, data: Partial<Client>) => void
  deleteClient: (id: string) => void
  seedClients: (clients: Client[]) => void
}

export const useClientStore = create<ClientState>()(
  persist(
    temporal(
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

        seedClients: (clients) => set({ clients }),
      }),
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
