import { useCallback } from 'react'
import { MatSizeSettings } from '@/modules/settings'
import { useClientStore } from '@/modules/clients'

export function SettingsPage() {
  const clients = useClientStore((s) => s.clients)

  const isSizeUsed = useCallback(
    (sizeId: string) => clients.some((c) => c.mats.some((m) => m.size === sizeId)),
    [clients],
  )

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-2xl font-bold text-slate-50">Настройки</h1>
      <MatSizeSettings isSizeUsed={isSizeUsed} />
    </div>
  )
}
