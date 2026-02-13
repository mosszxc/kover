import { useEffect, useCallback } from 'react'
import { Undo2, Redo2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import { useRouteStore } from '@/modules/routes'
import { useClientStore } from '@/modules/clients'

export function UndoRedo() {
  const routeTemporal = useRouteStore.temporal.getState()
  const clientTemporal = useClientStore.temporal.getState()

  const handleUndo = useCallback(() => {
    const routePast = useRouteStore.temporal.getState().pastStates
    const clientPast = useClientStore.temporal.getState().pastStates

    if (routePast.length >= clientPast.length && routePast.length > 0) {
      useRouteStore.temporal.getState().undo()
      toast.success('Отменено', { duration: 1500 })
    } else if (clientPast.length > 0) {
      useClientStore.temporal.getState().undo()
      toast.success('Отменено', { duration: 1500 })
    }
  }, [])

  const handleRedo = useCallback(() => {
    const routeFuture = useRouteStore.temporal.getState().futureStates
    const clientFuture = useClientStore.temporal.getState().futureStates

    if (routeFuture.length >= clientFuture.length && routeFuture.length > 0) {
      useRouteStore.temporal.getState().redo()
      toast.success('Повторено', { duration: 1500 })
    } else if (clientFuture.length > 0) {
      useClientStore.temporal.getState().redo()
      toast.success('Повторено', { duration: 1500 })
    }
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        handleRedo()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        handleRedo()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleUndo, handleRedo])

  const hasPast = routeTemporal.pastStates.length > 0 || clientTemporal.pastStates.length > 0
  const hasFuture = routeTemporal.futureStates.length > 0 || clientTemporal.futureStates.length > 0

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleUndo}
        disabled={!hasPast}
        title="Отменить (Ctrl+Z)"
        aria-label="Отменить"
        className="h-8 w-8 p-0"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRedo}
        disabled={!hasFuture}
        title="Повторить (Ctrl+Shift+Z)"
        aria-label="Повторить"
        className="h-8 w-8 p-0"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
