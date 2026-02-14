import type { DayOfWeek, MatSize } from '@/shared/types'

export interface MatSpec {
  size: MatSize
  quantity: number
  color?: string
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
  isActive: boolean
  pausedUntil?: string | null
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

/** Количество замен ковриков для конкретного дня (default = 1) */
export function getClientReplacements(client: Client, day: DayOfWeek): number {
  return client.dayReplacements?.[day] ?? 1
}
