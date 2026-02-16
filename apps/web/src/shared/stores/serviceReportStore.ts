import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface MatCount {
  sizeId: string
  expected: number
  pickedUp: number
  delivered: number
}

export interface ServiceReport {
  id: string
  clientId: string
  day: number
  date: string
  mats: MatCount[]
  hasDiscrepancy: boolean
  notes: string
  createdAt: string
}

interface ServiceReportState {
  reports: ServiceReport[]
  addReport: (report: ServiceReport) => void
  getClientReports: (clientId: string) => ServiceReport[]
}

const RETENTION_DAYS = 90

function pruneOldReports(reports: ServiceReport[]): ServiceReport[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)
  const cutoffStr = cutoff.toISOString()
  return reports.filter((r) => r.createdAt >= cutoffStr)
}

export const useServiceReportStore = create<ServiceReportState>()(
  persist(
    (set, get) => ({
      reports: [],

      addReport: (report) =>
        set((state) => ({
          reports: pruneOldReports([...state.reports, report]),
        })),

      getClientReports: (clientId) =>
        get().reports.filter((r) => r.clientId === clientId),
    }),
    { name: 'kover-service-reports', version: 1 },
  ),
)
