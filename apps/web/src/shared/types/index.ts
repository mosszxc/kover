/** Дни недели: ПН=0 ... ПТ=4 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4

/** Размеры ковриков — динамические, управляются через matSizeStore */
export type MatSize = string

/** Конфигурация одного размера коврика */
export interface MatSizeConfig {
  id: string
  label: string
  area: number
}

/** Стандартные размеры ковриков (используются как начальные данные стора) */
export const DEFAULT_MAT_SIZES: MatSizeConfig[] = [
  { id: '400', label: '400', area: 4.0 },
  { id: '250', label: '250', area: 3.7 },
  { id: '180', label: '180', area: 2.07 },
  { id: '150', label: '150', area: 1.275 },
  { id: '60x80', label: '60×80', area: 0.48 },
]

export const DAY_LABELS: Record<DayOfWeek, string> = {
  0: 'ПН',
  1: 'ВТ',
  2: 'СР',
  3: 'ЧТ',
  4: 'ПТ',
}

export const DAY_LABELS_FULL: Record<DayOfWeek, string> = {
  0: 'Понедельник',
  1: 'Вторник',
  2: 'Среда',
  3: 'Четверг',
  4: 'Пятница',
}
