export interface MatInventory {
  sizeId: string
  totalOwned: number
  inLaundry: number
  damaged: number
  washCycles: number
  maxWashCycles: number
}

export type TransactionType = 'purchase' | 'write_off' | 'laundry_in' | 'laundry_out'

export interface InventoryTransaction {
  id: string
  sizeId: string
  type: TransactionType
  quantity: number
  notes: string
  createdAt: string
}

export const TRANSACTION_LABELS: Record<TransactionType, string> = {
  purchase: 'Поступление',
  write_off: 'Списание',
  laundry_in: 'В стирку',
  laundry_out: 'Из стирки',
}
