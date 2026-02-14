import type { MatSize } from '@/shared/types'

export const MAT_SIZE_LABELS: Record<MatSize, string> = {
  '400': '400',
  '250': '250',
  '180': '180',
  '150': '150',
  '60x80': '60×80',
}

export const SIZE_ORDER: MatSize[] = ['400', '250', '180', '150', '60x80']

/** Цветовое кодирование по размерам — badge, summary, dot */
export const MAT_SIZE_STYLES: Record<MatSize, { badge: string; summary: string; dot: string }> = {
  '400': {
    badge: 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30',
    summary: 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/25',
    dot: 'bg-blue-400',
  },
  '250': {
    badge: 'bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30',
    summary: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/25',
    dot: 'bg-violet-400',
  },
  '180': {
    badge: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30',
    summary: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25',
    dot: 'bg-emerald-400',
  },
  '150': {
    badge: 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30',
    summary: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25',
    dot: 'bg-amber-400',
  },
  '60x80': {
    badge: 'bg-muted-foreground/20 text-foreground ring-1 ring-muted-foreground/30',
    summary: 'bg-muted-foreground/15 text-foreground ring-1 ring-muted-foreground/25',
    dot: 'bg-muted-foreground',
  },
}
