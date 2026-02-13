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
  notes: string
  isActive: boolean
  createdAt: string
  lat?: number
  lng?: number
}
