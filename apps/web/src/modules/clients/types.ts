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
  createdAt: string
  lat?: number
  lng?: number
}

/** Количество замен ковриков для конкретного дня (default = 1) */
export function getClientReplacements(client: Client, day: DayOfWeek): number {
  return client.dayReplacements?.[day] ?? 1
}
