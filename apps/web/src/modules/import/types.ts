import type { DayOfWeek } from '@/shared/types'

export interface ParsedExcel {
  masterRows: string[][]
  routesByDay: Record<DayOfWeek, string[]>
}
