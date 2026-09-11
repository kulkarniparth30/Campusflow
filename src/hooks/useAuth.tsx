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
  signIn: (email: string, password: string, roleHint?: Role) => Promise<void>
  signUp: (data: { email: string; password: string; full_name: string; role: Role; department?: string; roll_no?: string }) => Promise<void>
  signOut: () => Promise<void>
  view: AppView
  setView: (v: AppView) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const demoProfile = useCampusStore((s) => s.profile)
  const demoLogin = useCampusStore((s) => s.login)
  const demoSignUp = useCampusStore((s) => s.signUp)
  const demoLogout = useCampusStore((s) => s.logout)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<AppView>(() => {
    const r = demoProfile?.role
    return r === 'admin' || r === 'hod' ? 'hod' : r === 'faculty' ? 'faculty' : 'command'
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
      signIn: async (email, password, roleHint) => {
        setError(null)
        if (supabase && supabaseConfigured) {
          const { error: err } = await supabase.auth.signInWithPassword({ email, password })
          if (err) {
            const fail = demoLogin(email, password, roleHint)
            if (fail) {
              setError(err.message)
              throw err
            }
            return
          }
        }
        const fail = demoLogin(email, password, roleHint)
        if (fail && !supabaseConfigured) {
          setError(fail)
          throw new Error(fail)
        }
        const role = useCampusStore.getState().profile?.role
        setView(role === 'admin' || role === 'hod' ? 'hod' : role === 'faculty' ? 'faculty' : 'command')
      },
      signUp: async ({ email, password, full_name, role, department, roll_no }) => {
        setError(null)
        if (supabase && supabaseConfigured) {
          const { error: err } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name, role, department, roll_no } }
          })
          if (err) {
            const fail = demoSignUp(email, password, full_name, role, department, roll_no)
            if (fail) {
              setError(err.message)
              throw err
            }
            return
          }
        }
        const fail = demoSignUp(email, password, full_name, role, department, roll_no)
        if (fail && !supabaseConfigured) {
          setError(fail)
          throw new Error(fail)
        }
        const assignedRole = useCampusStore.getState().profile?.role
        setView(assignedRole === 'admin' || assignedRole === 'hod' ? 'hod' : assignedRole === 'faculty' ? 'faculty' : 'command')
      },
      signOut: async () => {
        if (supabase) await supabase.auth.signOut()
        demoLogout()
        setView('command')
      },
    }),
    [demoProfile, demoLogin, demoSignUp, demoLogout, error, view],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
