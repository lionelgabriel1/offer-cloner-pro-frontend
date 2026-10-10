'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading, configured } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  useEffect(() => { if (!loading && configured && !session) router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`) }, [configured, loading, pathname, router, session])
  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">A verificar sessão…</div>
  if (!configured) return <div className="flex min-h-screen items-center justify-center p-6"><div className="flex max-w-lg flex-col gap-3 rounded-lg border border-border bg-card p-6"><h1 className="font-semibold">Autenticação não configurada</h1><p className="text-sm text-muted-foreground">Define VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY para ativar o modo real.</p><Button variant="outline" onClick={() => router.push('/auth/login')}>Abrir autenticação</Button></div></div>
  if (!session) return null
  return <>{children}</>
}
