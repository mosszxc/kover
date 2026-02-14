import { useCallback } from 'react'
import { MatSizeSettings } from '@/modules/settings'
import { useClientStore } from '@/modules/clients'
import { useMatSizeStore } from '@/shared/stores/matSizeStore'

export function MatSizesPage() {
  const clients = useClientStore((s) => s.clients)
  const updateClient = useClientStore((s) => s.updateClient)
  const removeSize = useMatSizeStore((s) => s.removeSize)

  const isSizeUsed = useCallback(
    (sizeId: string) => clients.some((c) => c.mats.some((m) => m.size === sizeId)),
    [clients],
  )

  const getClientsUsing = useCallback(
    (sizeId: string) => clients.filter((c) => c.mats.some((m) => m.size === sizeId)).length,
    [clients],
  )

  const onDeleteAndReplace = useCallback(
    (oldSizeId: string, newSizeId: string) => {
      for (const client of clients) {
        if (client.mats.some((m) => m.size === oldSizeId)) {
          updateClient(client.id, {
            mats: client.mats.map((m) =>
              m.size === oldSizeId ? { ...m, size: newSizeId } : m,
            ),
          })
        }
      }
      removeSize(oldSizeId)
    },
    [clients, updateClient, removeSize],
  )

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <MatSizeSettings
        isSizeUsed={isSizeUsed}
        getClientsUsing={getClientsUsing}
        onDeleteAndReplace={onDeleteAndReplace}
      />
    </div>
  )
}
