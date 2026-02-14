import { useState, useCallback } from 'react'
import type { DayOfWeek } from '@/shared/types'
import type { MatSpec } from '../types'
import {
  emptyMat,
  specsToRows,
  validateClientForm,
  type MatRow,
  type FormErrors,
} from '../lib/formHelpers'

interface PopulateOptions {
  name: string
  address: string
  mats: MatSpec[]
  frequency: number
  days: DayOfWeek[]
  dayReplacements?: Partial<Record<DayOfWeek, number>>
  notes: string
}

export function useClientForm() {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [mats, setMats] = useState<MatRow[]>([emptyMat()])
  const [frequency, setFrequencyRaw] = useState(1)
  const [days, setDays] = useState<DayOfWeek[]>([])
  const [dayReplacements, setDayReplacements] = useState<Partial<Record<DayOfWeek, number>>>({})
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const setFrequency = useCallback((freq: number) => {
    setFrequencyRaw(freq)
    setDays((prev) => {
      if (prev.length > freq) {
        const trimmed = prev.sort().slice(0, freq)
        setDayReplacements((dr) => {
          const next: Partial<Record<DayOfWeek, number>> = {}
          for (const d of trimmed) {
            if (dr[d] != null) next[d] = dr[d]
          }
          return next
        })
        return trimmed
      }
      return prev
    })
  }, [])

  const clearError = useCallback((field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }, [])

  const addMat = useCallback(() => {
    setMats((prev) => [...prev, emptyMat()])
    setErrors((prev) => ({ ...prev, mats: undefined }))
  }, [])

  const removeMat = useCallback((index: number) => {
    setMats((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateMat = useCallback(
    (index: number, field: keyof MatRow, value: string | number) => {
      setMats((prev) =>
        prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
      )
    },
    [],
  )

  const toggleDay = useCallback(
    (day: DayOfWeek) => {
      setDays((prev) => {
        if (prev.includes(day)) {
          setDayReplacements((dr) => {
            const next = { ...dr }
            delete next[day]
            return next
          })
          return prev.filter((d) => d !== day)
        }
        if (prev.length >= frequency) return prev
        return [...prev, day]
      })
    },
    [frequency],
  )

  const setDayReplacement = useCallback(
    (day: DayOfWeek, count: number) => {
      const clamped = Math.max(1, Math.min(5, count))
      setDayReplacements((prev) => {
        if (clamped === 1) {
          const next = { ...prev }
          delete next[day]
          return next
        }
        return { ...prev, [day]: clamped }
      })
    },
    [],
  )

  const validate = useCallback((): boolean => {
    const e = validateClientForm(name, mats)
    if (Object.keys(e).length > 0) {
      setErrors(e)
      return false
    }
    return true
  }, [name, mats])

  const resetForm = useCallback(() => {
    setName('')
    setAddress('')
    setMats([emptyMat()])
    setFrequencyRaw(1)
    setDays([])
    setDayReplacements({})
    setNotes('')
    setErrors({})
  }, [])

  const populateForm = useCallback((opts: PopulateOptions) => {
    setName(opts.name)
    setAddress(opts.address)
    setMats(specsToRows(opts.mats))
    setFrequencyRaw(opts.frequency)
    setDays([...opts.days])
    setDayReplacements(opts.dayReplacements ? { ...opts.dayReplacements } : {})
    setNotes(opts.notes)
    setErrors({})
  }, [])

  const updateMatSize = useCallback(
    (index: number, size: string) => {
      updateMat(index, 'size', size)
    },
    [updateMat],
  )

  const updateMatQuantity = useCallback(
    (index: number, quantity: number) => {
      updateMat(index, 'quantity', Math.max(1, Math.min(99, quantity)))
    },
    [updateMat],
  )

  const updateMatColor = useCallback(
    (index: number, color: string) => {
      updateMat(index, 'color', color)
    },
    [updateMat],
  )

  return {
    // State
    name,
    address,
    mats,
    frequency,
    days,
    dayReplacements,
    notes,
    errors,
    // Setters
    setName,
    setAddress,
    setFrequency,
    setNotes,
    // Mat ops
    addMat,
    removeMat,
    updateMat,
    updateMatSize,
    updateMatQuantity,
    updateMatColor,
    // Day ops
    toggleDay,
    setDayReplacement,
    // Form ops
    validate,
    resetForm,
    populateForm,
    clearError,
  }
}

export type ClientFormState = ReturnType<typeof useClientForm>
