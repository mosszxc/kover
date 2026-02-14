import type { MatSpec } from '../types'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'

export interface MatRow {
  size: string
  quantity: number
  color: string
}

export interface FormErrors {
  name?: string
  mats?: string
  days?: string
}

export function emptyMat(): MatRow {
  const sizes = useMatSizeStore.getState().sizes
  return { size: sizes[0]?.id ?? '180', quantity: 1, color: '' }
}

export function rowsToSpecs(rows: MatRow[]): MatSpec[] {
  return rows.map((m) => ({
    size: m.size,
    quantity: m.quantity,
    ...(m.color.trim() ? { color: m.color.trim() } : {}),
  }))
}

export function specsToRows(specs: MatSpec[]): MatRow[] {
  return specs.map((m) => ({ size: m.size, quantity: m.quantity, color: m.color ?? '' }))
}

export function buildOriginalName(name: string, address: string, mats: MatRow[]): string {
  const parts = [name.trim()]
  if (address.trim()) parts.push(address.trim())
  const matsSummary = mats
    .map((m) => `${m.quantity}\u00d7${m.size}`)
    .join(', ')
  if (matsSummary) parts.push(matsSummary)
  return parts.join(' ')
}

export function validateClientForm(
  name: string,
  mats: MatRow[],
  days: readonly unknown[] = [],
  frequency: number = 1,
): FormErrors {
  const e: FormErrors = {}
  if (!name.trim()) e.name = 'Название обязательно'
  if (mats.length === 0) e.mats = 'Добавьте хотя бы один коврик'
  if (days.length > 0 && days.length < frequency) {
    const diff = frequency - days.length
    e.days = `Выберите ещё ${diff} ${diff === 1 ? 'день' : diff < 5 ? 'дня' : 'дней'}`
  }
  return e
}

export function validateField(
  field: keyof FormErrors,
  name: string,
  mats: MatRow[],
  days: readonly unknown[] = [],
  frequency: number = 1,
): string | undefined {
  switch (field) {
    case 'name':
      return !name.trim() ? 'Название обязательно' : undefined
    case 'mats':
      return mats.length === 0 ? 'Добавьте хотя бы один коврик' : undefined
    case 'days': {
      if (days.length > 0 && days.length < frequency) {
        const diff = frequency - days.length
        return `Выберите ещё ${diff} ${diff === 1 ? 'день' : diff < 5 ? 'дня' : 'дней'}`
      }
      return undefined
    }
  }
}
