import type { DayOfWeek } from '@/shared/types'
import type { Client } from '@/modules/clients'

export interface BriefingData {
  today: DayOfWeek
  todayLabel: string
  route: RouteBriefing
  alerts: Alert[]
  returningClients: Client[]
  wornMats: WornMat[]
}

export interface RouteBriefing {
  totalStops: number
  activeStops: number
  skippedStops: number
  drivers: string[]
  totalMatsSqm: number
}

export interface Alert {
  id: string
  type: 'overload' | 'shortage' | 'overdue'
  title: string
  description: string
}

export interface WornMat {
  sizeId: string
  sizeLabel: string
  washCycles: number
  maxWashCycles: number
  wearPercent: number
}
