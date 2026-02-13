import { Loader2 } from 'lucide-react'

export function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  )
}
