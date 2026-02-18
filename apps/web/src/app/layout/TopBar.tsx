import { FeedbackDialog } from '@/shared/components/FeedbackDialog'
import { UndoRedo } from '@/shared/components/UndoRedo'
import { FileSyncIndicator } from '@/shared/components/FileSyncIndicator'
import { SyncStatusIndicator } from '@/shared/components/SyncStatusIndicator'

export function TopBar() {
  return (
    <header className="no-print h-14 border-b border-border bg-card flex items-center justify-between px-4 md:px-6">
      <div className="md:hidden flex items-center">
        <span className="text-lg font-bold text-foreground">Kover</span>
        <span className="text-xs text-muted-foreground ml-1.5">{__APP_VERSION__}</span>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <SyncStatusIndicator />
        <FileSyncIndicator />
        <FeedbackDialog />
        <UndoRedo />
      </div>
    </header>
  )
}
