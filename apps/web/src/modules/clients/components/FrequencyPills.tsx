import { FREQUENCY_OPTIONS } from '@/shared/constants'

interface FrequencyPillsProps {
  value: number
  onChange: (frequency: number) => void
}

export function FrequencyPills({ value, onChange }: FrequencyPillsProps) {
  return (
    <div className="flex gap-2">
      {FREQUENCY_OPTIONS.map((freq) => (
        <button
          key={freq}
          type="button"
          onClick={() => onChange(freq)}
          aria-pressed={value === freq}
          className={`flex h-11 min-w-[44px] items-center justify-center rounded-md border px-3 text-base font-medium tabular-nums transition-colors ${
            value === freq
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-slate-200'
          }`}
        >
          {freq}
        </button>
      ))}
    </div>
  )
}
