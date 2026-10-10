'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage(){const [email,setEmail]=useState('');const [error,setError]=useState('');const [message,setMessage]=useState('');async function submit(e:FormEvent){e.preventDefault();setError('');const supabase=createClient();if(!supabase){setError('Supabase não está configurado.');return}const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/auth/callback`});if(error)setError('Não foi possível enviar o email de recuperação.');else setMessage('Se existir uma conta, receberás um email com instruções.')}return <main className="flex min-h-screen items-center justify-center bg-background p-6"><Card className="w-full max-w-md"><CardHeader><CardTitle>Recuperar palavra-passe</CardTitle><CardDescription>Enviaremos um link para redefinir o acesso.</CardDescription></CardHeader><CardContent><form className="flex flex-col gap-4" onSubmit={submit}><div className="flex flex-col gap-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></div>{error&&<div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}{message&&<div role="status" className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">{message}</div>}<Button>Enviar instruções</Button><Link className="text-center text-sm text-primary hover:underline" href="/auth/login">Voltar ao login</Link></form></CardContent></Card></main>}
