import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { temporal } from 'zundo'
import type { MatInventory, InventoryTransaction, TransactionType } from './types'

interface InventoryState {
  inventory: MatInventory[]
  transactions: InventoryTransaction[]
  setInventory: (sizeId: string, data: Partial<MatInventory>) => void
  addTransaction: (tx: InventoryTransaction) => void
  recordPurchase: (sizeId: string, quantity: number, notes?: string) => void
  recordWriteOff: (sizeId: string, quantity: number, notes?: string) => void
  recordLaundryIn: (sizeId: string, quantity: number) => void
  recordLaundryOut: (sizeId: string, quantity: number) => void
}

function createTransaction(sizeId: string, type: TransactionType, quantity: number, notes = ''): InventoryTransaction {
  return {
    id: crypto.randomUUID(),
    sizeId,
    type,
    quantity,
    notes,
    createdAt: new Date().toISOString(),
  }
}

function ensureSize(inventory: MatInventory[], sizeId: string): MatInventory[] {
  if (inventory.some((i) => i.sizeId === sizeId)) return inventory
  return [...inventory, { sizeId, totalOwned: 0, inLaundry: 0, damaged: 0 }]
}

function updateSize(inventory: MatInventory[], sizeId: string, updater: (item: MatInventory) => MatInventory): MatInventory[] {
  const ensured = ensureSize(inventory, sizeId)
  return ensured.map((i) => (i.sizeId === sizeId ? updater(i) : i))
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    temporal(
      (set) => ({
        inventory: [],
        transactions: [],

        setInventory: (sizeId, data) =>
          set((state) => ({
            inventory: updateSize(state.inventory, sizeId, (i) => ({ ...i, ...data })),
          })),

        addTransaction: (tx) =>
          set((state) => ({ transactions: [...state.transactions, tx] })),

        recordPurchase: (sizeId, quantity, notes = '') =>
          set((state) => ({
            inventory: updateSize(state.inventory, sizeId, (i) => ({
              ...i,
              totalOwned: i.totalOwned + quantity,
            })),
            transactions: [...state.transactions, createTransaction(sizeId, 'purchase', quantity, notes)],
          })),

        recordWriteOff: (sizeId, quantity, notes = '') =>
          set((state) => ({
            inventory: updateSize(state.inventory, sizeId, (i) => ({
              ...i,
              totalOwned: Math.max(0, i.totalOwned - quantity),
              damaged: i.damaged + quantity,
            })),
            transactions: [...state.transactions, createTransaction(sizeId, 'write_off', quantity, notes)],
          })),

        recordLaundryIn: (sizeId, quantity) =>
          set((state) => ({
            inventory: updateSize(state.inventory, sizeId, (i) => ({
              ...i,
              inLaundry: i.inLaundry + quantity,
            })),
            transactions: [...state.transactions, createTransaction(sizeId, 'laundry_in', quantity)],
          })),

        recordLaundryOut: (sizeId, quantity) =>
          set((state) => ({
            inventory: updateSize(state.inventory, sizeId, (i) => ({
              ...i,
              inLaundry: Math.max(0, i.inLaundry - quantity),
            })),
            transactions: [...state.transactions, createTransaction(sizeId, 'laundry_out', quantity)],
          })),
      }),
      {
        limit: 20,
        partialize: (state) => {
          const { inventory, transactions } = state
          return { inventory, transactions } as InventoryState
        },
      },
    ),
    { name: 'kover-inventory', version: 1 },
  ),
)
