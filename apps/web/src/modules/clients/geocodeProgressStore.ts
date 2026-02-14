import { create } from 'zustand'

type GeocodeStatus = 'idle' | 'running' | 'completed' | 'error'

interface GeocodeProgressState {
  status: GeocodeStatus
  done: number
  total: number
  success: number
  start: () => void
  setTotal: (total: number) => void
  tick: (success: boolean) => void
  finish: (success: number, total: number) => void
  reset: () => void
}

export const useGeocodeProgressStore = create<GeocodeProgressState>()((set) => ({
  status: 'idle',
  done: 0,
  total: 0,
  success: 0,

  start: () => set({ status: 'running', done: 0, total: 0, success: 0 }),

  setTotal: (total) => set({ total }),

  tick: (ok) =>
    set((s) => ({
      done: s.done + 1,
      success: ok ? s.success + 1 : s.success,
    })),

  finish: (success, total) =>
    set({ status: 'completed', success, done: total, total }),

  reset: () => set({ status: 'idle', done: 0, total: 0, success: 0 }),
}))
