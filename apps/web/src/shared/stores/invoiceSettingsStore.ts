import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface InvoiceSettings {
  companyName: string
  inn: string
  bankName: string
  bankAccount: string
  bik: string
  corrAccount: string
  invoicePrefix: string
}

interface InvoiceSettingsState extends InvoiceSettings {
  update: (settings: Partial<InvoiceSettings>) => void
}

export const useInvoiceSettingsStore = create<InvoiceSettingsState>()(
  persist(
    (set) => ({
      companyName: '',
      inn: '',
      bankName: '',
      bankAccount: '',
      bik: '',
      corrAccount: '',
      invoicePrefix: 'К',

      update: (settings) => set((state) => ({ ...state, ...settings })),
    }),
    { name: 'kover-invoice-settings' },
  ),
)
