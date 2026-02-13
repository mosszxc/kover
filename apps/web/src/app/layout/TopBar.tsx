import { FeedbackDialog } from '@/shared/components/FeedbackDialog'
import { UndoRedo } from '@/shared/components/UndoRedo'
import { FileSyncIndicator } from '@/shared/components/FileSyncIndicator'

export function TopBar() {
  return (
    <header className="no-print h-14 border-b border-slate-700 bg-slate-900 flex items-center justify-between px-4 md:px-6">
      <div className="md:hidden text-lg font-bold text-slate-50">Kover</div>
      <div className="ml-auto flex items-center gap-1">
        <FileSyncIndicator />
        <FeedbackDialog />
        <UndoRedo />
      </div>
    </header>
  )
}
