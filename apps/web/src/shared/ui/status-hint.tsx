import type { ReactNode } from 'react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/shared/ui/popover'
import { cn } from '@/shared/lib/utils'

const VARIANT_STYLES = {
  warning: 'border-amber-500/30',
  error: 'border-red-500/30',
  info: 'border-blue-500/30',
  muted: 'border-border',
} as const

const ICON_STYLES = {
  warning: 'text-amber-400',
  error: 'text-red-400',
  info: 'text-blue-400',
  muted: 'text-muted-foreground',
} as const

interface StatusHintProps {
  children: ReactNode
  title: string
  description: string
  action?: string
  variant?: keyof typeof VARIANT_STYLES
}

export function StatusHint({
  children,
  title,
  description,
  action,
  variant = 'info',
}: StatusHintProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex shrink-0 cursor-pointer items-center rounded-sm transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'w-64 p-3 text-sm',
          VARIANT_STYLES[variant],
        )}
        side="top"
        align="center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className={cn('font-medium', ICON_STYLES[variant])}>{title}</p>
        <p className="mt-1 text-muted-foreground">{description}</p>
        {action && (
          <p className="mt-1.5 text-xs text-foreground/80">
            {action}
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
