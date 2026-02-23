import { useMemo } from 'react'
import { usePaymentStore, useDebtContactStore } from '@/modules/payments'
import { useClientStore } from '@/modules/clients'
import { useServiceLogStore } from '@/shared/stores/serviceLogStore'
import { useChurnDismissStore } from '@/shared/stores/churnDismissStore'

export type ChurnRiskLevel = 'high' | 'medium' | 'none'

export type ChurnRiskReason =
  | 'debt_overdue_90'
  | 'debt_overdue_60'
  | 'long_pause'
  | 'multiple_skips'

export const CHURN_REASON_LABELS: Record<ChurnRiskReason, string> = {
  debt_overdue_90: 'Долг просрочен 90+ дней',
  debt_overdue_60: 'Долг просрочен 60+ дней',
  long_pause: 'Долгая пауза (30+ дней)',
  multiple_skips: '3+ пропуска за 30 дней',
}

export interface ChurnRiskInfo {
  clientId: string
  clientName: string
  level: ChurnRiskLevel
  reasons: ChurnRiskReason[]
  isDismissed: boolean
}

export interface ChurnRiskData {
  /** All clients with risk (including dismissed) */
  allAtRisk: ChurnRiskInfo[]
  /** Only active (non-dismissed) at-risk clients */
  activeAtRisk: ChurnRiskInfo[]
  /** Map for quick lookup by clientId */
  riskMap: Map<string, ChurnRiskInfo>
  highCount: number
  mediumCount: number
}

function getDaysOverdue(period: string): number {
  const parts = period.split('-').map(Number)
  const year = parts[0] ?? 0
  const month = parts[1] ?? 0
  const periodEnd = new Date(year, month, 0)
  const now = new Date()
  const diff = now.getTime() - periodEnd.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

function getDaysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export function useChurnRisk(): ChurnRiskData {
  const clients = useClientStore((s) => s.clients)
  const payments = usePaymentStore((s) => s.payments)
  const contacts = useDebtContactStore((s) => s.contacts)
  const serviceEntries = useServiceLogStore((s) => s.entries)
  const dismissals = useChurnDismissStore((s) => s.dismissals)
  const isDismissed = useChurnDismissStore((s) => s.isDismissed)

  return useMemo(() => {
    const clientMap = new Map(clients.map((c) => [c.id, c.name]))
    const contactMap = new Map(contacts.map((c) => [c.clientId, c]))

    // Compute max overdue days per client
    const clientMaxOverdue = new Map<string, number>()
    for (const p of payments) {
      if (p.paidAmount >= p.expectedAmount) continue
      const days = getDaysOverdue(p.period)
      if (days <= 0) continue
      const existing = clientMaxOverdue.get(p.clientId) ?? 0
      clientMaxOverdue.set(p.clientId, Math.max(existing, days))
    }

    // Compute skips per client in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()
    const clientSkips = new Map<string, number>()
    for (const entry of serviceEntries) {
      if (entry.type === 'skipped' && entry.timestamp >= thirtyDaysAgoStr) {
        clientSkips.set(entry.clientId, (clientSkips.get(entry.clientId) ?? 0) + 1)
      }
    }

    const allAtRisk: ChurnRiskInfo[] = []

    for (const client of clients) {
      const reasons: ChurnRiskReason[] = []
      const maxOverdue = clientMaxOverdue.get(client.id) ?? 0
      const skips = clientSkips.get(client.id) ?? 0
      const contact = contactMap.get(client.id)
      const daysSinceContact = getDaysSince(contact?.lastContactedAt ?? null)

      // Debt rules
      if (maxOverdue >= 90) {
        reasons.push('debt_overdue_90')
      } else if (maxOverdue >= 60) {
        // High if no recent contact (never contacted or > 14 days ago)
        const noRecentContact = daysSinceContact === null || daysSinceContact > 14
        if (noRecentContact) {
          reasons.push('debt_overdue_60')
        }
      }

      // Long pause rule
      if (client.pausedUntil) {
        const pausedUntilDate = new Date(client.pausedUntil)
        const now = new Date()
        const daysUntilUnpause = Math.floor(
          (pausedUntilDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        )
        if (daysUntilUnpause > 30) {
          reasons.push('long_pause')
        }
      }

      // Multiple skips rule
      if (skips >= 3) {
        reasons.push('multiple_skips')
      }

      if (reasons.length === 0) continue

      const hasHighReason = reasons.includes('debt_overdue_90') || reasons.includes('debt_overdue_60')
      const level: ChurnRiskLevel = hasHighReason ? 'high' : 'medium'

      allAtRisk.push({
        clientId: client.id,
        clientName: clientMap.get(client.id) ?? 'Неизвестный',
        level,
        reasons,
        isDismissed: isDismissed(client.id),
      })
    }

    // Sort: high first, then medium
    allAtRisk.sort((a, b) => {
      if (a.level === 'high' && b.level !== 'high') return -1
      if (a.level !== 'high' && b.level === 'high') return 1
      return 0
    })

    const activeAtRisk = allAtRisk.filter((r) => !r.isDismissed)
    const riskMap = new Map(allAtRisk.map((r) => [r.clientId, r]))

    return {
      allAtRisk,
      activeAtRisk,
      highCount: activeAtRisk.filter((r) => r.level === 'high').length,
      mediumCount: activeAtRisk.filter((r) => r.level === 'medium').length,
      riskMap,
    }
  }, [clients, payments, contacts, serviceEntries, dismissals, isDismissed])
}
