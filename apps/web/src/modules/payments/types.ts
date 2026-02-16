export type PaymentStatus = 'paid' | 'partial' | 'overdue' | 'pending'

export interface Payment {
  id: string
  clientId: string
  /** YYYY-MM format */
  period: string
  /** Auto-calculated expected amount */
  expectedAmount: number
  /** Actually paid amount */
  paidAmount: number
  paidAt: string | null
  notes: string
  createdAt: string
}

export function getPaymentStatus(payment: Payment): PaymentStatus {
  if (payment.paidAmount >= payment.expectedAmount) return 'paid'
  if (payment.paidAmount > 0) return 'partial'
  const now = new Date()
  const parts = payment.period.split('-').map(Number)
  const year = parts[0] ?? 0
  const month = parts[1] ?? 0
  const periodEnd = new Date(year, month, 0)
  if (now > periodEnd) return 'overdue'
  return 'pending'
}

export function getCurrentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function formatPeriod(period: string): string {
  const parts = period.split('-').map(Number)
  const year = parts[0] ?? 0
  const month = parts[1] ?? 1
  const date = new Date(year, month - 1)
  return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })
}

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
  paid: { label: 'Оплачен', className: 'bg-emerald-600/20 text-emerald-400' },
  partial: { label: 'Частично', className: 'bg-amber-600/20 text-amber-400' },
  overdue: { label: 'Просрочен', className: 'bg-red-600/20 text-red-400' },
  pending: { label: 'Ожидает', className: 'bg-muted text-muted-foreground' },
}
