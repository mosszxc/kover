import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PrintColumnConfig {
  phone: boolean
}

const DEFAULT_COLUMNS: PrintColumnConfig = {
  phone: false,
}

interface PrintSettingsState {
  columns: PrintColumnConfig
  setColumn: (key: keyof PrintColumnConfig, visible: boolean) => void
}

export const usePrintSettingsStore = create<PrintSettingsState>()(
  persist(
    (set) => ({
      columns: DEFAULT_COLUMNS,

      setColumn: (key, visible) =>
        set((state) => ({
          columns: { ...state.columns, [key]: visible },
        })),
    }),
    { name: 'kover-print' },
  ),
)
