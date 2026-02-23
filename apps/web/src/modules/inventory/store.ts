import { create } from 'zustand'
import { temporal } from 'zundo'
import type { MatInventory, MatBatch, InventoryTransaction, TransactionType } from './types'
import { getMatMaxWashCycles } from '@/shared/stores/matSizeStore'
import { syncInventoryChanges } from '@/shared/lib/sync/inventorySync'

interface InventoryState {
  inventory: MatInventory[]
  batches: MatBatch[]
  transactions: InventoryTransaction[]
  setInventory: (sizeId: string, data: Partial<MatInventory>) => void
  addTransaction: (tx: InventoryTransaction) => void
  recordPurchase: (sizeId: string, quantity: number, notes?: string) => void
  recordWriteOff: (sizeId: string, quantity: number, notes?: string) => void
  recordLaundryIn: (sizeId: string, quantity: number) => void
  recordLaundryOut: (sizeId: string, quantity: number) => void
  updateMaxWashCycles: (sizeId: string, maxWashCycles: number) => void
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
  return [...inventory, { sizeId, totalOwned: 0, inLaundry: 0, damaged: 0, washCycles: 0, maxWashCycles: getMatMaxWashCycles(sizeId) }]
}

function updateSize(inventory: MatInventory[], sizeId: string, updater: (item: MatInventory) => MatInventory): MatInventory[] {
  const ensured = ensureSize(inventory, sizeId)
  return ensured.map((i) => (i.sizeId === sizeId ? updater(i) : i))
}

/** Distribute wash cycles across batches FIFO (oldest first) */
function distributeLaundryOut(batches: MatBatch[], sizeId: string, quantity: number): MatBatch[] {
  const sizeBatches = batches
    .filter((b) => b.sizeId === sizeId && b.remaining > 0)
    .sort((a, b) => a.purchasedAt.localeCompare(b.purchasedAt))

  let remaining = quantity
  const updated = new Map<string, MatBatch>()

  for (const batch of sizeBatches) {
    if (remaining <= 0) break
    const cyclesForBatch = Math.min(remaining, batch.remaining)
    updated.set(batch.id, {
      ...batch,
      washCycles: batch.washCycles + cyclesForBatch,
    })
    remaining -= cyclesForBatch
  }

  return batches.map((b) => updated.get(b.id) ?? b)
}

/** Write off from oldest batches first (FIFO) */
function distributeWriteOff(batches: MatBatch[], sizeId: string, quantity: number): MatBatch[] {
  const sizeBatches = batches
    .filter((b) => b.sizeId === sizeId && b.remaining > 0)
    .sort((a, b) => a.purchasedAt.localeCompare(b.purchasedAt))

  let remaining = quantity
  const updated = new Map<string, MatBatch>()

  for (const batch of sizeBatches) {
    if (remaining <= 0) break
    const toRemove = Math.min(remaining, batch.remaining)
    updated.set(batch.id, {
      ...batch,
      remaining: batch.remaining - toRemove,
    })
    remaining -= toRemove
  }

  return batches.map((b) => updated.get(b.id) ?? b)
}

export const useInventoryStore = create<InventoryState>()(
  temporal(
    (set) => ({
      inventory: [],
      batches: [],
      transactions: [],

      setInventory: (sizeId, data) =>
        set((state) => ({
          inventory: updateSize(state.inventory, sizeId, (i) => ({ ...i, ...data })),
        })),

      addTransaction: (tx) =>
        set((state) => ({ transactions: [...state.transactions, tx] })),

      recordPurchase: (sizeId, quantity, notes = '') =>
        set((state) => {
          const maxWashCycles = state.inventory.find((i) => i.sizeId === sizeId)?.maxWashCycles ?? getMatMaxWashCycles(sizeId)
          const newBatch: MatBatch = {
            id: crypto.randomUUID(),
            sizeId,
            quantity,
            remaining: quantity,
            washCycles: 0,
            maxWashCycles,
            purchasedAt: new Date().toISOString(),
          }
          return {
            inventory: updateSize(state.inventory, sizeId, (i) => ({
              ...i,
              totalOwned: i.totalOwned + quantity,
            })),
            batches: [...state.batches, newBatch],
            transactions: [...state.transactions, createTransaction(sizeId, 'purchase', quantity, notes)],
          }
        }),

      recordWriteOff: (sizeId, quantity, notes = '') =>
        set((state) => ({
          inventory: updateSize(state.inventory, sizeId, (i) => ({
            ...i,
            totalOwned: Math.max(0, i.totalOwned - quantity),
            damaged: i.damaged + quantity,
          })),
          batches: distributeWriteOff(state.batches, sizeId, quantity),
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
            washCycles: (i.washCycles ?? 0) + quantity,
          })),
          batches: distributeLaundryOut(state.batches, sizeId, quantity),
          transactions: [...state.transactions, createTransaction(sizeId, 'laundry_out', quantity)],
        })),

      updateMaxWashCycles: (sizeId, maxWashCycles) =>
        set((state) => ({
          inventory: state.inventory.map((i) =>
            i.sizeId === sizeId ? { ...i, maxWashCycles } : i,
          ),
          batches: state.batches.map((b) =>
            b.sizeId === sizeId ? { ...b, maxWashCycles } : b,
          ),
        })),
    }),
    {
      limit: 20,
      partialize: (state) => {
        const { inventory, batches, transactions } = state
        return { inventory, batches, transactions } as InventoryState
      },
    },
  ),
)

// Subscribe-based write-through sync (like routes)
useInventoryStore.subscribe((state, prevState) => {
  syncInventoryChanges(
    { inventory: prevState.inventory, batches: prevState.batches, transactions: prevState.transactions },
    { inventory: state.inventory, batches: state.batches, transactions: state.transactions },
  )
})
