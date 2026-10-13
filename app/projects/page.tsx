'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, FolderKanban, Loader2, Plus, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/components/auth-provider'
import { apiClient, type ProjectListResponse } from '@/lib/api'

const projectStatus: Record<string, string> = { created: 'Criado', ready: 'Pronto para editar', edited: 'Editado', failed: 'Falhou' }
function dateLabel(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Data indisponível' : date.toLocaleString('pt-PT')
}

export default function ProjectsPage() {
  const { session, loading: authLoading, configured } = useAuth()
  const [data, setData] = useState<ProjectListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [offset, setOffset] = useState(0)
  const token = session?.access_token

  useEffect(() => {
    if (authLoading) return
    if (!configured || !apiClient.configured) { setLoading(false); setError('Configuração Supabase/API em falta.'); return }
    if (!token) { setLoading(false); setError('Inicia sessão para consultar os teus projetos.'); return }
    let active = true
    setLoading(true)
    setError('')
    apiClient.listProjects({ offset, limit: 20 }, token).then(result => {
      if (active) setData(result)
    }).catch(reason => {
      if (active) setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os projetos.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [authLoading, configured, token, retry, offset])

  const retryButton = <button type="button" onClick={() => setRetry(value => value + 1)} className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent"><RefreshCw className="size-3.5" /> Tentar novamente</button>

  return <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8 sm:py-10">
    <div className="mx-auto max-w-5xl">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-3.5" /> Voltar à visão geral</Link>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Workspace</p><h1 className="text-3xl font-semibold tracking-tight">Projetos</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Organiza os modelos reconstruídos, prepara edições e acompanha o estado de cada projeto.</p></div>
        <Link href="/" className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"><Plus className="size-4" /> Nova análise</Link>
      </div>

      {loading && <Card className="mt-8"><CardContent className="flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> A carregar projetos…</CardContent></Card>}
      {!loading && error && <Card className="mt-8 border-destructive/30"><CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center"><p role="alert" className="text-sm text-destructive">{error}</p>{!token && <Link href="/auth/login" className="text-sm text-primary hover:underline">Iniciar sessão</Link>}{token && retryButton}</CardContent></Card>}
      {!loading && !error && data?.projects.length === 0 && <Card className="mt-8 border-dashed bg-transparent shadow-none"><CardContent className="flex flex-col items-center px-6 py-14 text-center sm:py-20">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-border bg-card"><FolderKanban className="size-6 text-muted-foreground" /></div>
        <h2 className="text-base font-medium">Ainda não há projetos na tua conta</h2>
        <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Esta lista mostra apenas projetos devolvidos pela API para a tua sessão. Quando abrires no editor uma página rastreada, o projeto derivado aparecerá aqui.</p>
        <Link href="/" className="mt-5 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">Começar por uma URL <ArrowRight className="size-4" /></Link>
      </CardContent></Card>}
      {!loading && !error && data && data.projects.length > 0 && <section className="mt-8 space-y-3" aria-label="Projetos da conta">
        {data.projects.map(project => <Card key={project.id}><CardContent className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="min-w-0"><p className="truncate text-sm font-medium">{project.sourceUrl}</p><p className="mt-1 text-xs text-muted-foreground">{projectStatus[project.status] ?? project.status} · Atualizado {dateLabel(project.updatedAt)}</p></div>
          {project.status === 'ready' || project.status === 'edited'
            ? <Link href={`/editor/${encodeURIComponent(project.id)}`} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-accent">Abrir editor <ArrowRight className="size-3.5" /></Link>
            : <span className="shrink-0 text-xs text-muted-foreground">Modelo ainda indisponível</span>}
        </CardContent></Card>)}
        {data.pagination.total > 20 && <div className="flex items-center justify-between gap-3 pt-3 text-xs text-muted-foreground"><span>{offset + 1}–{offset + data.projects.length} de {data.pagination.total} projetos</span><div className="flex gap-2"><button type="button" disabled={offset === 0} onClick={() => setOffset(value => Math.max(0, value - 20))} className="rounded-md border border-input px-3 py-2 disabled:opacity-40">Anterior</button><button type="button" disabled={!data.pagination.hasMore} onClick={() => setOffset(value => value + 20)} className="rounded-md border border-input px-3 py-2 disabled:opacity-40">Seguinte</button></div></div>}
      </section>}
    </div>
  </main>
}
