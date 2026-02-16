import type { DayOfWeek, MatSize } from '@/shared/types'

export interface MatSpec {
  size: MatSize
  quantity: number
  color?: string
}

export interface ClientNote {
  id: string
  text: string
  createdAt: string
}

export interface Client {
  id: string
  originalName: string
  name: string
  address: string
  mats: MatSpec[]
  frequency: number
  days: DayOfWeek[]
  dayReplacements?: Partial<Record<DayOfWeek, number>>
  notes: string
  clientNotes?: ClientNote[]
  isActive: boolean
  pausedUntil?: string | null
  workingHoursStart?: string | null
  workingHoursEnd?: string | null
  contactName?: string | null
  contactPhone?: string | null
  customMonthlyPrice?: number | null
  createdAt: string
  lat?: number
  lng?: number
}

/** Клиент на паузе? Учитывает isActive и pausedUntil */
export function isClientPaused(client: Client): boolean {
  if (!client.isActive) return true
  if (client.pausedUntil) {
    const today = new Date().toISOString().slice(0, 10)
    return client.pausedUntil > today
  }
  return false
}

/** Форматирует дату pausedUntil для отображения (напр. "3 мар") */
export function formatPausedUntil(date: string): string {
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
  const d = new Date(date + 'T00:00:00')
  return `${d.getDate()} ${months[d.getMonth()]}`
}

/** Форматирует часы работы клиента (напр. "8:00–17:00") */
export function formatWorkingHours(client: Client): string | null {
  if (!client.workingHoursStart && !client.workingHoursEnd) return null
  const start = client.workingHoursStart ?? '?'
  const end = client.workingHoursEnd ?? '?'
  return `${start}–${end}`
}

/** Количество замен ковриков для конкретного дня (default = 1) */
export function getClientReplacements(client: Client, day: DayOfWeek): number {
  return client.dayReplacements?.[day] ?? 1
}
