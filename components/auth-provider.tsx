'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

type AuthContextValue = { session: Session | null; loading: boolean; configured: boolean; signOut: () => Promise<void> }
const AuthContext = createContext<AuthContextValue>({ session: null, loading: true, configured: false, signOut: async () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const configured = isSupabaseConfigured()

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) { setLoading(false); return }
    supabase.auth.getSession().then(({ data, error }: { data: { session: Session | null }; error: Error | null }) => {
      if (error) setSession(null)
      else setSession(data.session)
      setLoading(false)
    }).catch(() => { setSession(null); setLoading(false) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, nextSession: Session | null) => setSession(nextSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  async function signOut() {
    const supabase = createClient()
    if (supabase) await supabase.auth.signOut()
    setSession(null)
  }

  return <AuthContext.Provider value={{ session, loading, configured, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }
