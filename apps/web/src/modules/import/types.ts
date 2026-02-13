import type { DayOfWeek } from '@/shared/types'

export interface ParsedExcel {
  masterRows: string[][]
  routesByDay: Record<DayOfWeek, string[]>
}

export interface ParsedMatSpec {
  size: string
  quantity: number
  color?: string
}

export interface ParsedClient {
  originalName: string
  name: string
  address: string
  mats: ParsedMatSpec[]
  notes: string
  confidence: 'high' | 'low'
}
