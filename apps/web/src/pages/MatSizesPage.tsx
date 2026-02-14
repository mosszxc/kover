import { useCallback } from 'react'
import { MatSizeSettings } from '@/modules/settings'
import { useClientStore } from '@/modules/clients'

export function MatSizesPage() {
  const clients = useClientStore((s) => s.clients)

  const isSizeUsed = useCallback(
    (sizeId: string) => clients.some((c) => c.mats.some((m) => m.size === sizeId)),
    [clients],
  )

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <MatSizeSettings isSizeUsed={isSizeUsed} />
    </div>
  )
}
