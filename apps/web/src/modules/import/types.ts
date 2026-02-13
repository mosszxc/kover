import type { DayOfWeek, MatSize } from '@/shared/types'

export interface ParsedExcel {
  masterRows: string[][]
  routesByDay: Record<DayOfWeek, string[]>
}

export interface ParsedMatSpec {
  size: MatSize
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
