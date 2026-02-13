import type { DayOfWeek, MatSize } from '@/shared/types'

/** Опции размеров ковриков для форм (value + label) */
export const MAT_SIZE_OPTIONS: { value: MatSize; label: string }[] = [
  { value: '180', label: '180' },
  { value: '150', label: '150' },
  { value: '60x80', label: '60x80' },
  { value: '400', label: '400' },
  { value: '250', label: '250' },
]

/** Варианты частоты обслуживания (раз в неделю) */
export const FREQUENCY_OPTIONS = [1, 2, 3, 4, 5] as const

/** Рабочие дни ПН-ПТ */
export const ALL_WORK_DAYS: DayOfWeek[] = [0, 1, 2, 3, 4]
