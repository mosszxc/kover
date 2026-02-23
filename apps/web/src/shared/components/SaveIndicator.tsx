import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { initSaveInterceptor, onSave } from '@/shared/lib/saveEvent'

export function SaveIndicator() {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    initSaveInterceptor()

    return onSave(() => {
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        toast.success('Сохранено', { duration: 1500 })
      }, 300)
    })
  }, [])

  useEffect(() => {
    return () => clearTimeout(debounceRef.current)
  }, [])

  return null
}
