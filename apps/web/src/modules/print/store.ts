import { create } from 'zustand'
import { syncSettingChange } from '@/shared/lib/sync/settingsSync'

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
  (set) => ({
    columns: DEFAULT_COLUMNS,

    setColumn: (key, visible) => {
      set((state) => {
        const columns = { ...state.columns, [key]: visible }
        syncSettingChange('printSettings', columns)
        return { columns }
      })
    },
  }),
)
