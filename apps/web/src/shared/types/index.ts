/** Дни недели: ПН=0 ... ПТ=4 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4

/** Размеры ковриков */
export type MatSize = '180' | '150' | '60x80' | '400' | '250'

export const DAY_LABELS: Record<DayOfWeek, string> = {
  0: 'ПН',
  1: 'ВТ',
  2: 'СР',
  3: 'ЧТ',
  4: 'ПТ',
}

/** Все размеры ковриков в стандартном порядке */
export const MAT_SIZES: MatSize[] = ['180', '150', '60x80', '400', '250']

export const MAT_AREA: Record<MatSize, number> = {
  '180': 2.07,
  '150': 1.275,
  '60x80': 0.48,
  '400': 4.0,
  '250': 3.7,
}
