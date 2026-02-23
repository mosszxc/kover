import { create } from 'zustand'
import { supabaseSync } from '@/shared/lib/sync/supabaseSync'
import { serviceReportsAdapter } from '@/shared/lib/sync/adapters'

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

export const useServiceReportStore = create<ServiceReportState>()(
  supabaseSync(
    {
      adapter: serviceReportsAdapter,
      getItems: (state: ServiceReportState) => state.reports,
      itemsKey: 'reports',
    },
    (set, get) => ({
      reports: [],

      addReport: (report) =>
        set((state) => ({
          reports: [...state.reports, report],
        })),

      getClientReports: (clientId) =>
        get().reports.filter((r) => r.clientId === clientId),
    }),
  ),
)
