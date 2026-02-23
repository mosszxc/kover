import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

export function SaveIndicator() {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const handler = () => {
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        toast.success('Сохранено', { duration: 1500 })
      }, 300)
    }

    window.addEventListener('kover-synced', handler)
    return () => {
      window.removeEventListener('kover-synced', handler)
      clearTimeout(debounceRef.current)
    }
  }, [])

  return null
}
