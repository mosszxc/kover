import { useState, useCallback } from 'react'
import type { DayOfWeek, MatSize } from '@/shared/types'
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
  notes: string
}

export function useClientForm() {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [mats, setMats] = useState<MatRow[]>([emptyMat()])
  const [frequency, setFrequency] = useState(1)
  const [days, setDays] = useState<DayOfWeek[]>([])
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

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

  const toggleDay = useCallback((day: DayOfWeek) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )
  }, [])

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
    setFrequency(1)
    setDays([])
    setNotes('')
    setErrors({})
  }, [])

  const populateForm = useCallback((opts: PopulateOptions) => {
    setName(opts.name)
    setAddress(opts.address)
    setMats(specsToRows(opts.mats))
    setFrequency(opts.frequency)
    setDays([...opts.days])
    setNotes(opts.notes)
    setErrors({})
  }, [])

  const updateMatSize = useCallback(
    (index: number, size: MatSize) => {
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
    // Form ops
    validate,
    resetForm,
    populateForm,
    clearError,
  }
}

export type ClientFormState = ReturnType<typeof useClientForm>
