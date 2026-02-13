import type { DayOfWeek } from '@/shared/types'

export interface RouteStop {
  id: string
  clientId: string
  position: number
  isCompleted: boolean
  driverId?: string
}

export interface DayRoute {
  day: DayOfWeek
  stops: RouteStop[]
}
