import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
    { name: 'kover-clients', version: 1 },
  ),
)
