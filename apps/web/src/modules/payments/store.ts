import { create } from 'zustand'
import { temporal } from 'zundo'
import { supabaseSync } from '@/shared/lib/sync/supabaseSync'
import { paymentsAdapter } from '@/shared/lib/sync/adapters'
import type { Payment } from './types'

interface PaymentState {
  payments: Payment[]
  addPayment: (payment: Payment) => void
  updatePayment: (id: string, data: Partial<Payment>) => void
  deletePayment: (id: string) => void
}

export const usePaymentStore = create<PaymentState>()(
  supabaseSync(
    {
      adapter: paymentsAdapter,
      getItems: (state: PaymentState) => state.payments,
      itemsKey: 'payments',
    },
    temporal(
      (set) => ({
        payments: [],

        addPayment: (payment) =>
          set((state) => ({ payments: [...state.payments, payment] })),

        updatePayment: (id, data) =>
          set((state) => ({
            payments: state.payments.map((p) =>
              p.id === id ? { ...p, ...data } : p,
            ),
          })),

        deletePayment: (id) =>
          set((state) => ({
            payments: state.payments.filter((p) => p.id !== id),
          })),
      }),
      {
        limit: 20,
        partialize: (state) => {
          const { payments } = state
          return { payments } as PaymentState
        },
      },
    ),
  ),
)
