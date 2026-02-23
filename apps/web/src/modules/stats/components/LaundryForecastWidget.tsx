import { WashingMachine, UserPlus } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { DAY_LABELS } from '@/shared/types'
import { useLaundryForecast14 } from '../hooks/useLaundryForecast14'
import type { LoadLevel } from '../hooks/useLaundryForecast14'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip'

const LEVEL_CONFIG: Record<LoadLevel, { bg: string; border: string; text: string; label: string }> = {
  normal: {
    bg: 'bg-green-500/5',
    border: 'border-green-500/30',
    text: 'text-green-400',
    label: 'Норма',
  },
  elevated: {
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    label: 'Повышенная',
  },
  peak: {
    bg: 'bg-red-500/5',
    border: 'border-red-500/30',
    text: 'text-red-400',
    label: 'Пик',
  },
}

function formatDate(dateStr: string): string {
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()} ${months[d.getMonth()]}`
}

export function LaundryForecastWidget() {
  const { days, avgArea } = useLaundryForecast14()

  // Don't show if no data
  const hasData = days.some((d) => d.stopCount > 0)
  if (!hasData) return null

  // Split into week 1 and week 2
  const week1 = days.slice(0, 7)
  const week2 = days.slice(7, 14)

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WashingMachine className="size-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-foreground">Прогноз загрузки стирки</h3>
        </div>
        <span className="text-sm text-muted-foreground">
          Средняя: {avgArea} м²
        </span>
      </div>

      <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block size-2.5 rounded-full bg-green-500" />
          Норма
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2.5 rounded-full bg-amber-500" />
          Повышенная
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2.5 rounded-full bg-red-500" />
          Пик
        </span>
      </div>

      <TooltipProvider>
        <div className="space-y-3">
          <WeekRow label="Эта неделя" days={week1} />
          <WeekRow label="Следующая неделя" days={week2} />
        </div>
      </TooltipProvider>
    </div>
  )
}

function WeekRow({ label, days }: { label: string; days: ReturnType<typeof useLaundryForecast14>['days'] }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const config = LEVEL_CONFIG[d.loadLevel]
          const hasReturning = d.returningFromPause.length > 0

          return (
            <Tooltip key={d.date}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'flex flex-col items-center rounded-lg border px-1.5 py-2 transition-colors',
                    d.stopCount > 0 ? [config.bg, config.border] : 'border-border/50 bg-muted/30',
                  )}
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    {DAY_LABELS[d.dayOfWeek]}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70">{formatDate(d.date)}</span>
                  {d.stopCount > 0 ? (
                    <>
                      <span className={cn('mt-1 text-lg font-bold tabular-nums leading-tight', config.text)}>
                        {d.totalArea}
                      </span>
                      <span className="text-[10px] text-muted-foreground">м²</span>
                      <span className="mt-0.5 text-[10px] text-muted-foreground">
                        {d.stopCount} ост.
                      </span>
                      {hasReturning && (
                        <UserPlus className="mt-0.5 size-3 text-blue-400" />
                      )}
                    </>
                  ) : (
                    <span className="mt-1 text-xs text-muted-foreground/50">—</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-52">
                <div className="space-y-1 text-xs">
                  <div className="font-medium">{formatDate(d.date)} ({DAY_LABELS[d.dayOfWeek]})</div>
                  {d.stopCount > 0 ? (
                    <>
                      <div>Объём: {d.totalArea} м² ({LEVEL_CONFIG[d.loadLevel].label})</div>
                      <div>Остановок: {d.stopCount}</div>
                      {Object.entries(d.matsBySize).length > 0 && (
                        <div>
                          Коврики:{' '}
                          {Object.entries(d.matsBySize)
                            .map(([size, qty]) => `${size}: ${qty}`)
                            .join(', ')}
                        </div>
                      )}
                      {hasReturning && (
                        <div className="text-blue-400">
                          Возвращаются из паузы: {d.returningFromPause.join(', ')}
                        </div>
                      )}
                    </>
                  ) : (
                    <div>Нет маршрутов</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
