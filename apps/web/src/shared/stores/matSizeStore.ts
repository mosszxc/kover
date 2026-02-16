import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MatSizeConfig } from '@/shared/types'
import { DEFAULT_MAT_SIZES } from '@/shared/types'
import { supabaseSync, matSizesAdapter } from '@/shared/lib/sync'

interface MatSizeState {
  sizes: MatSizeConfig[]
  addSize: (id: string, label: string, area: number, rentalPrice: number) => void
  updateSize: (id: string, updates: { label?: string; area?: number; rentalPrice?: number }) => void
  removeSize: (id: string) => void
}

export const useMatSizeStore = create<MatSizeState>()(
  persist(
    supabaseSync(
      {
        adapter: matSizesAdapter,
        getItems: (state) => (state as MatSizeState).sizes,
        itemsKey: 'sizes',
      },
    (set) => ({
      sizes: DEFAULT_MAT_SIZES,

      addSize: (id, label, area, rentalPrice) =>
        set((state) => ({
          sizes: [...state.sizes, { id, label, area, rentalPrice }],
        })),

      updateSize: (id, updates) =>
        set((state) => ({
          sizes: state.sizes.map((s) =>
            s.id === id ? { ...s, ...updates } : s,
          ),
        })),

      removeSize: (id) =>
        set((state) => ({
          sizes: state.sizes.filter((s) => s.id !== id),
        })),
    }),
    ),
    {
      name: 'kover-mat-sizes',
      merge: (persisted, current) => {
        const state = { ...current, ...(persisted as Partial<MatSizeState>) }
        state.sizes = state.sizes.map((s) => ({
          ...s,
          rentalPrice: s.rentalPrice ?? 0,
        }))
        return state
      },
    },
  ),
)

/** Получить площадь размера по id (для использования вне React-компонентов) */
export function getMatArea(sizeId: string): number {
  const sizes = useMatSizeStore.getState().sizes
  return sizes.find((s) => s.id === sizeId)?.area ?? 0
}

/** Получить label размера по id */
export function getMatLabel(sizeId: string): string {
  const sizes = useMatSizeStore.getState().sizes
  return sizes.find((s) => s.id === sizeId)?.label ?? sizeId
}

/** Получить цену аренды размера по id */
export function getMatRentalPrice(sizeId: string): number {
  const sizes = useMatSizeStore.getState().sizes
  return sizes.find((s) => s.id === sizeId)?.rentalPrice ?? 0
}
