import { useMemo } from 'react'
import type { DayOfWeek } from '@/shared/types'
import { ALL_WORK_DAYS } from '@/shared/constants'
import { useSettingsStore } from '@/shared/stores/settingsStore'

const WEEKEND_DAYS: DayOfWeek[] = [5, 6]

export function useVisibleDays(): DayOfWeek[] {
  const showWeekends = useSettingsStore((s) => s.showWeekends)

  return useMemo(
    () => (showWeekends ? ALL_WORK_DAYS : ALL_WORK_DAYS.filter((d) => !WEEKEND_DAYS.includes(d))),
    [showWeekends],
  )
}
