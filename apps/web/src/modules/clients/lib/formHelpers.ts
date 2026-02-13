import type { MatSize } from '@/shared/types'
import type { MatSpec } from '../types'

export interface MatRow {
  size: MatSize
  quantity: number
  color: string
}

export interface FormErrors {
  name?: string
  mats?: string
}

export function emptyMat(): MatRow {
  return { size: '180', quantity: 1, color: '' }
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

export function validateClientForm(name: string, mats: MatRow[]): FormErrors {
  const e: FormErrors = {}
  if (!name.trim()) e.name = 'Название обязательно'
  if (mats.length === 0) e.mats = 'Добавьте хотя бы один коврик'
  return e
}
