import { LogOut } from 'lucide-react'
import { FeedbackDialog } from '@/shared/components/FeedbackDialog'
import { UndoRedo } from '@/shared/components/UndoRedo'
import { FileSyncIndicator } from '@/shared/components/FileSyncIndicator'
import { SyncStatusIndicator } from '@/shared/components/SyncStatusIndicator'
import { Button } from '@/shared/ui/button'
import { useAuthStore, signOut, isAuthRequired } from '@/shared/lib/auth'

export function TopBar() {
  const user = useAuthStore((s) => s.user)

  return (
    <header className="no-print h-14 border-b border-border bg-card flex items-center justify-between px-4 md:px-6">
      <div className="md:hidden text-lg font-bold text-foreground">Kover</div>
      <div className="ml-auto flex items-center gap-1">
        <SyncStatusIndicator />
        <FileSyncIndicator />
        <FeedbackDialog />
        <UndoRedo />
        {isAuthRequired() && user && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => signOut()}
            title="Выйти"
          >
            <LogOut className="size-4" />
          </Button>
        )}
      </div>
    </header>
  )
}
