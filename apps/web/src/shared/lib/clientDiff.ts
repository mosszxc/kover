import type { DayOfWeek } from '@/shared/types'
import { DAY_LABELS } from '@/shared/types'

interface MatSpec {
  size: string
  quantity: number
  color?: string
}

interface ClientLike {
  name: string
  address: string
  mats: MatSpec[]
  frequency: number
  days: DayOfWeek[]
  notes: string
  workingHoursStart?: string | null
  workingHoursEnd?: string | null
}

interface DiffResult {
  scheduleChanges: string[]
  profileChanges: string[]
}

function formatDays(days: DayOfWeek[]): string {
  return [...days].sort().map((d) => DAY_LABELS[d]).join(',')
}

function formatMats(mats: MatSpec[]): string {
  return mats.map((m) => `${m.size}×${m.quantity}`).join(', ')
}

function formatHours(start?: string | null, end?: string | null): string | null {
  if (!start && !end) return null
  return `${start ?? '?'}–${end ?? '?'}`
}

export function diffClient(before: ClientLike, after: Partial<ClientLike>): DiffResult {
  const scheduleChanges: string[] = []
  const profileChanges: string[] = []

  // Schedule fields
  if (after.days !== undefined) {
    const beforeDays = formatDays(before.days)
    const afterDays = formatDays(after.days)
    if (beforeDays !== afterDays) {
      scheduleChanges.push(`Дни: ${beforeDays} → ${afterDays}`)
    }
  }

  if (after.frequency !== undefined && after.frequency !== before.frequency) {
    scheduleChanges.push(`Частота: раз в ${before.frequency} нед. → раз в ${after.frequency} нед.`)
  }

  // Profile fields
  if (after.name !== undefined && after.name !== before.name) {
    profileChanges.push(`Имя: ${before.name} → ${after.name}`)
  }

  if (after.address !== undefined && after.address !== before.address) {
    profileChanges.push(`Адрес: ${before.address || '—'} → ${after.address || '—'}`)
  }

  if (after.mats !== undefined) {
    const beforeMats = formatMats(before.mats)
    const afterMats = formatMats(after.mats)
    if (beforeMats !== afterMats) {
      profileChanges.push(`Коврики: ${beforeMats || '—'} → ${afterMats || '—'}`)
    }
  }

  if (after.notes !== undefined && after.notes !== before.notes) {
    profileChanges.push(`Заметки: ${before.notes || '—'} → ${after.notes || '—'}`)
  }

  if (after.workingHoursStart !== undefined || after.workingHoursEnd !== undefined) {
    const beforeHours = formatHours(before.workingHoursStart, before.workingHoursEnd)
    const afterHours = formatHours(
      after.workingHoursStart !== undefined ? after.workingHoursStart : before.workingHoursStart,
      after.workingHoursEnd !== undefined ? after.workingHoursEnd : before.workingHoursEnd,
    )
    if (beforeHours !== afterHours) {
      profileChanges.push(`Часы работы: ${beforeHours ?? '—'} → ${afterHours ?? '—'}`)
    }
  }

  return { scheduleChanges, profileChanges }
}
