import { create } from 'zustand'
import { syncSettingChange } from '@/shared/lib/sync/settingsSync'

export interface CostSettings {
  laundryCostPerSqm: number
  logisticsCostPerStop: number
}

interface CostSettingsState extends CostSettings {
  update: (settings: Partial<CostSettings>) => void
}

export const useCostSettingsStore = create<CostSettingsState>()(
  (set) => ({
    laundryCostPerSqm: 0,
    logisticsCostPerStop: 0,

    update: (settings) => {
      set((state) => ({ ...state, ...settings }))
      syncSettingChange('costSettings', settings)
    },
  }),
)
