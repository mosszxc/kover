import { create } from 'zustand'
import { syncSettingChange } from '@/shared/lib/sync/settingsSync'

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
  (set) => ({
    companyName: '',
    inn: '',
    bankName: '',
    bankAccount: '',
    bik: '',
    corrAccount: '',
    invoicePrefix: 'К',

    update: (settings) => {
      set((state) => ({ ...state, ...settings }))
      syncSettingChange('invoiceSettings', settings)
    },
  }),
)
