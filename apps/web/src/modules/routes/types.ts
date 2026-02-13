import type { DayOfWeek } from '@/shared/types'

export interface RouteStop {
  id: string
  clientId: string
  position: number
  isCompleted: boolean
}

export interface RouteBlock {
  id: string
  name?: string
  stops: RouteStop[]
}

export interface DayRoute {
  day: DayOfWeek
  blocks: RouteBlock[]
}
