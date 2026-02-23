import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { initSaveInterceptor, onSave } from '@/shared/lib/saveEvent'

export function SaveIndicator() {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    initSaveInterceptor()

    return onSave(() => {
      setVisible(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setVisible(false), 2000)
    })
  }, [])

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  return (
    <div
      className={`flex items-center gap-1 text-xs text-muted-foreground transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      aria-live="polite"
    >
      <Check className="h-3.5 w-3.5 text-green-500" />
      <span className="hidden sm:inline">Сохранено</span>
    </div>
  )
}
