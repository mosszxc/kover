import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      toastOptions={{
        className:
          'bg-slate-800 text-slate-50 border-slate-700',
      }}
    />
  )
}
