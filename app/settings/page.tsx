'use client'

import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Settings2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/auth-provider'

export default function SettingsPage() {
  const { session } = useAuth()
  return <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-10"><div className="mx-auto max-w-3xl"><Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Voltar ao dashboard</Link><div className="mb-8 flex items-start gap-4"><div className="rounded-xl bg-primary/10 p-3 text-primary"><Settings2 className="size-5" /></div><div><h1 className="text-2xl font-semibold tracking-tight">Definições</h1><p className="mt-1 text-sm text-muted-foreground">Estado da configuração suportada pelo frontend.</p></div></div><Card><CardHeader><CardTitle className="text-sm">Sessão</CardTitle></CardHeader><CardContent className="flex items-center gap-3 text-sm">{session ? <><CheckCircle2 className="size-4 text-primary" /> Sessão Supabase activa</> : <><span className="size-2 rounded-full bg-muted-foreground" /> Sem sessão activa; inicia sessão para usar a API.</>}</CardContent></Card><Card className="mt-5"><CardHeader><CardTitle className="text-sm">Integração API</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">A URL da API e as chaves públicas são configuradas pelo ambiente da aplicação. Não são editáveis nesta página e nenhum segredo é guardado no browser.</CardContent></Card><Card className="mt-5"><CardHeader><CardTitle className="text-sm">Pixels e acompanhamento</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Esta área está reservada para uma configuração suportada pelo backend. O contrato actual não disponibiliza endpoints para guardar pixels ou eventos; nenhum identificador é guardado ou apresentado como activo.</CardContent></Card></div></main>
}
