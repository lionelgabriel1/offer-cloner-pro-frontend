'use client'

import { FormEvent, Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authErrorMessage, createClient, isSupabaseConfigured } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter(); const params = useSearchParams(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); const supabase = createClient(); if (!supabase || !isSupabaseConfigured()) { setError('Supabase não está configurado.'); return }; setBusy(true); const result = await supabase.auth.signInWithPassword({ email, password }); setBusy(false); if (result.error) { setError(authErrorMessage(result.error.message)); return }; router.replace(params.get('next') || '/') }
  return <main className="flex min-h-screen items-center justify-center bg-background p-6"><Card className="w-full max-w-md"><CardHeader><CardTitle>Entrar no Offer Cloner Pro</CardTitle><CardDescription>Usa as tuas credenciais para aceder ao workspace.</CardDescription></CardHeader><CardContent><form className="flex flex-col gap-4" onSubmit={submit}><div className="flex flex-col gap-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div><div className="flex flex-col gap-2"><Label htmlFor="password">Palavra-passe</Label><Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>{error && <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}<Button type="submit" disabled={busy}>{busy ? 'A entrar…' : 'Entrar'}</Button><div className="flex justify-between text-sm"><Link className="text-primary hover:underline" href="/auth/forgot-password">Recuperar palavra-passe</Link><Link className="text-primary hover:underline" href="/auth/sign-up">Criar conta</Link></div></form></CardContent></Card></main>
}

export default function LoginPage() { return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-background p-6 text-sm text-muted-foreground">A carregar…</main>}><LoginForm /></Suspense> }
