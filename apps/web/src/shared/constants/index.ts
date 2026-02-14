import type { DayOfWeek } from '@/shared/types'

/** Варианты частоты обслуживания (раз в неделю) */
export const FREQUENCY_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const

/** Все дни недели ПН-ВС */
export const ALL_WORK_DAYS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6]

export { MAT_SIZE_LABELS, MAT_SIZE_STYLES, SIZE_ORDER } from './matStyles'
