import { useMemo } from 'react'
import { usePaymentStore } from '../store'
import { type PaymentStatus, getCurrentPeriod, getPaymentStatus } from '../types'

export interface ClientPaymentInfo {
  status: PaymentStatus
  expectedAmount: number
  paidAmount: number
  debt: number
}

export function useClientPaymentStatus(): Map<string, ClientPaymentInfo> {
  const payments = usePaymentStore((s) => s.payments)

  return useMemo(() => {
    const currentPeriod = getCurrentPeriod()
    const map = new Map<string, ClientPaymentInfo>()

    for (const payment of payments) {
      if (payment.period !== currentPeriod) continue
      map.set(payment.clientId, {
        status: getPaymentStatus(payment),
        expectedAmount: payment.expectedAmount,
        paidAmount: payment.paidAmount,
        debt: Math.max(0, payment.expectedAmount - payment.paidAmount),
      })
    }

    return map
  }, [payments])
}
