import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { useCampusStore } from '../store/campus'
import type { AppView, Profile, Role } from '../types'

interface AuthContextValue {
  profile: Profile | null
  role: Role | null
  live: boolean
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  view: AppView
  setView: (v: AppView) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const demoProfile = useCampusStore((s) => s.profile)
  const demoLogin = useCampusStore((s) => s.login)
  const demoLogout = useCampusStore((s) => s.logout)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<AppView>(() => {
    const r = demoProfile?.role
    return r === 'hod' ? 'hod' : r === 'faculty' ? 'faculty' : r === 'admin' ? 'admin' : 'command'
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      profile: demoProfile,
      role: demoProfile?.role ?? null,
      live: supabaseConfigured,
      loading: false,
      error,
      view,
      setView,
      signIn: async (email, password) => {
        setError(null)
        if (supabase && supabaseConfigured) {
          const { error: err } = await supabase.auth.signInWithPassword({ email, password })
          if (err) {
            const fail = demoLogin(email, password)
            if (fail) {
              setError(err.message)
              throw err
            }
            return
          }
        }
        const fail = demoLogin(email, password)
        if (fail && !supabaseConfigured) {
          setError(fail)
          throw new Error(fail)
        }
        const role = useCampusStore.getState().profile?.role
        setView(role === 'hod' ? 'hod' : role === 'faculty' ? 'faculty' : role === 'admin' ? 'admin' : 'command')
      },
      signOut: async () => {
        if (supabase) await supabase.auth.signOut()
        demoLogout()
        setView('command')
      },
    }),
    [demoProfile, demoLogin, demoLogout, error, view],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
