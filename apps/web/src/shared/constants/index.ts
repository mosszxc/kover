import type { DayOfWeek } from '@/shared/types'

/** Варианты частоты обслуживания (раз в неделю) */
export const FREQUENCY_OPTIONS = [1, 2, 3, 4, 5] as const

/** Рабочие дни ПН-ПТ */
export const ALL_WORK_DAYS: DayOfWeek[] = [0, 1, 2, 3, 4]
