import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      toastOptions={{
        className:
          'bg-muted text-foreground border-border',
      }}
    />
  )
}
