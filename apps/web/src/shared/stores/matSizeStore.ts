import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MatSizeConfig } from '@/shared/types'
import { DEFAULT_MAT_SIZES } from '@/shared/types'

interface MatSizeState {
  sizes: MatSizeConfig[]
  addSize: (id: string, label: string, area: number) => void
  updateSize: (id: string, updates: { label?: string; area?: number }) => void
  removeSize: (id: string) => void
}

export const useMatSizeStore = create<MatSizeState>()(
  persist(
    (set) => ({
      sizes: DEFAULT_MAT_SIZES,

      addSize: (id, label, area) =>
        set((state) => ({
          sizes: [...state.sizes, { id, label, area }],
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
    { name: 'kover-mat-sizes' },
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
