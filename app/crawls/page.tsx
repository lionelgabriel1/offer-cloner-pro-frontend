'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, FileSearch, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function AnalysesPage() {
  return <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8 sm:py-10">
    <div className="mx-auto max-w-5xl">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-3.5" /> Voltar à visão geral</Link>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Workspace</p><h1 className="text-3xl font-semibold tracking-tight">Análises</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Acompanha as capturas iniciadas e consulta as páginas descobertas em cada job.</p></div>
        <Button asChild className="gap-2"><Link href="/"><Plus className="size-4" /> Nova captura</Link></Button>
      </div>
      <Card className="mt-8 border-dashed bg-transparent shadow-none"><CardContent className="flex flex-col items-center px-6 py-14 text-center sm:py-20">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-border bg-card"><FileSearch className="size-6 text-muted-foreground" /></div>
        <h2 className="text-base font-medium">A lista de análises ainda não está ligada</h2>
        <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">O backend permite criar e consultar um job quando tens o respectivo identificador, mas ainda não expõe um endpoint para listar todos os jobs da conta. Assim que esse endpoint existir, esta página poderá mostrar o histórico real.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3"><Button asChild><Link href="/">Iniciar uma captura <ArrowRight className="size-4" /></Link></Button><Button asChild variant="outline"><Link href="/documentation">Ver documentação</Link></Button></div>
      </CardContent></Card>
      <p className="mt-6 text-xs text-muted-foreground">Nenhuma análise de demonstração é apresentada nesta lista.</p>
    </div>
  </main>
}
