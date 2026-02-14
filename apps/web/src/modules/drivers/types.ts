import type { DayOfWeek } from '@/shared/types'

export interface Driver {
  id: string
  name: string
  phone: string
  isActive: boolean
  workDays: DayOfWeek[]
  createdAt: string
}
