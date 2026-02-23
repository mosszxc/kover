import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DayOfWeek } from '@/shared/types'
import { generateId } from '@/shared/lib/generateId'

export type StopExecutionStatus = 'completed' | 'skipped' | 'problem'

export interface StopExecution {
  id: string
  clientId: string
  stopId: string
  date: string
  day: DayOfWeek
  status: StopExecutionStatus
  note?: string
  driverName?: string
  createdAt: string
}

interface RouteExecutionState {
  executions: StopExecution[]
  setExecution: (params: Omit<StopExecution, 'id' | 'createdAt'>) => void
  removeExecution: (stopId: string, date: string) => void
  getExecutionsForDate: (date: string) => StopExecution[]
  getExecution: (stopId: string, date: string) => StopExecution | undefined
}

const RETENTION_DAYS = 90

function pruneOldExecutions(executions: StopExecution[]): StopExecution[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  return executions.filter((e) => e.date >= cutoffStr)
}

export const useRouteExecutionStore = create<RouteExecutionState>()(
  persist(
    (set, get) => ({
      executions: [],

      setExecution: (params) =>
        set((state) => {
          // Replace existing execution for same stop+date, or add new
          const existing = state.executions.findIndex(
            (e) => e.stopId === params.stopId && e.date === params.date,
          )
          const newExecution: StopExecution = {
            ...params,
            id: generateId(),
            createdAt: new Date().toISOString(),
          }
          if (existing !== -1) {
            const updated = [...state.executions]
            updated[existing] = newExecution
            return { executions: updated }
          }
          return { executions: [...state.executions, newExecution] }
        }),

      removeExecution: (stopId, date) =>
        set((state) => ({
          executions: state.executions.filter(
            (e) => !(e.stopId === stopId && e.date === date),
          ),
        })),

      getExecutionsForDate: (date) =>
        get().executions.filter((e) => e.date === date),

      getExecution: (stopId, date) =>
        get().executions.find((e) => e.stopId === stopId && e.date === date),
    }),
    {
      name: 'kover-route-execution',
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<RouteExecutionState>) }
        merged.executions = pruneOldExecutions(merged.executions)
        return merged
      },
    },
  ),
)
