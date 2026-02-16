import { useMemo } from 'react'
import { usePaymentStore } from '@/modules/payments'
import { useClientStore } from '@/modules/clients'

export interface AgingBucket {
  label: string
  clientCount: number
  totalDebt: number
}

export interface TopDebtor {
  clientId: string
  clientName: string
  totalDebt: number
  oldestDays: number
}

export interface DebtAgingData {
  totalDebt: number
  totalDebtors: number
  buckets: AgingBucket[]
  topDebtors: TopDebtor[]
}

function getDaysOverdue(period: string): number {
  const parts = period.split('-').map(Number)
  const year = parts[0] ?? 0
  const month = parts[1] ?? 0
  const periodEnd = new Date(year, month, 0) // last day of period month
  const now = new Date()
  const diff = now.getTime() - periodEnd.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export function useDebtAging(): DebtAgingData {
  const payments = usePaymentStore((s) => s.payments)
  const clients = useClientStore((s) => s.clients)

  return useMemo(() => {
    const clientMap = new Map(clients.map((c) => [c.id, c.name]))

    // Find all unpaid/partially paid payments that are overdue
    const overduePayments = payments.filter((p) => {
      if (p.paidAmount >= p.expectedAmount) return false
      const days = getDaysOverdue(p.period)
      return days > 0
    })

    // Aggregate per client
    const clientDebts = new Map<string, { totalDebt: number; oldestDays: number }>()
    for (const p of overduePayments) {
      const debt = p.expectedAmount - p.paidAmount
      const days = getDaysOverdue(p.period)
      const existing = clientDebts.get(p.clientId)
      if (existing) {
        existing.totalDebt += debt
        existing.oldestDays = Math.max(existing.oldestDays, days)
      } else {
        clientDebts.set(p.clientId, { totalDebt: debt, oldestDays: days })
      }
    }

    // Aging buckets
    const bucketDefs = [
      { label: 'Текущая (до 30 дн)', min: 0, max: 30 },
      { label: '30–60 дней', min: 30, max: 60 },
      { label: '60–90 дней', min: 60, max: 90 },
      { label: '90+ дней', min: 90, max: Infinity },
    ]

    const buckets: AgingBucket[] = bucketDefs.map((def) => {
      const matching = new Set<string>()
      let debt = 0
      for (const p of overduePayments) {
        const days = getDaysOverdue(p.period)
        if (days >= def.min && days < def.max) {
          matching.add(p.clientId)
          debt += p.expectedAmount - p.paidAmount
        }
      }
      return {
        label: def.label,
        clientCount: matching.size,
        totalDebt: Math.round(debt * 100) / 100,
      }
    })

    // Top 5 debtors
    const topDebtors: TopDebtor[] = [...clientDebts.entries()]
      .map(([clientId, data]) => ({
        clientId,
        clientName: clientMap.get(clientId) ?? 'Неизвестный',
        totalDebt: Math.round(data.totalDebt * 100) / 100,
        oldestDays: data.oldestDays,
      }))
      .sort((a, b) => b.totalDebt - a.totalDebt)
      .slice(0, 5)

    const totalDebt = Math.round(
      [...clientDebts.values()].reduce((sum, d) => sum + d.totalDebt, 0) * 100,
    ) / 100

    return {
      totalDebt,
      totalDebtors: clientDebts.size,
      buckets,
      topDebtors,
    }
  }, [payments, clients])
}
