'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, FolderKanban, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function ProjectsPage() {
  return <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8 sm:py-10">
    <div className="mx-auto max-w-5xl">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-3.5" /> Voltar à visão geral</Link>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Workspace</p><h1 className="text-3xl font-semibold tracking-tight">Projetos</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Organiza os modelos reconstruídos, prepara edições e acompanha o estado de cada projecto.</p></div>
        <Link href="/" className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"><Plus className="size-4" /> Criar projecto</Link>
      </div>
      <Card className="mt-8 border-dashed bg-transparent shadow-none"><CardContent className="flex flex-col items-center px-6 py-14 text-center sm:py-20">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-border bg-card"><FolderKanban className="size-6 text-muted-foreground" /></div>
        <h2 className="text-base font-medium">Ainda não existe uma listagem de projectos</h2>
        <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">O editor consegue carregar um modelo quando recebe o identificador do projecto, mas o backend ainda não fornece uma listagem agregada. Não vamos mostrar cartões fictícios nem afirmar que há projectos guardados sem confirmação da API.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3"><Link href="/" className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">Começar por uma URL <ArrowRight className="size-4" /></Link><Link href="/documentation" className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent">Ver documentação</Link></div>
      </CardContent></Card>
    </div>
  </main>
}
