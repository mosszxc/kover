import { useEffect, useRef } from 'react'
import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '@/shared/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  setAuth: (user: User | null, session: Session | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  setAuth: (user, session) => set({ user, session, loading: false }),
  setLoading: (loading) => set({ loading }),
}))

export function useAuthListener() {
  const initialized = useRef(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const setLoading = useAuthStore((s) => s.setLoading)

  useEffect(() => {
    if (initialized.current) return
    if (!isSupabaseConfigured() || !supabase) {
      setAuth(null, null)
      return
    }
    initialized.current = true

    setLoading(true)

    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuth(session?.user ?? null, session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(session?.user ?? null, session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setAuth, setLoading])
}

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('Supabase не настроен')
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export function isAuthRequired(): boolean {
  return isSupabaseConfigured()
}
