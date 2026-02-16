import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CostSettings {
  laundryCostPerSqm: number
  logisticsCostPerStop: number
}

interface CostSettingsState extends CostSettings {
  update: (settings: Partial<CostSettings>) => void
}

export const useCostSettingsStore = create<CostSettingsState>()(
  persist(
    (set) => ({
      laundryCostPerSqm: 0,
      logisticsCostPerStop: 0,

      update: (settings) => set((state) => ({ ...state, ...settings })),
    }),
    { name: 'kover-cost-settings' },
  ),
)
