'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, FileJson2, Globe2, RefreshCw, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient, isApiConfigured, type CrawlJobStatus, type CrawlPageListResponse, type SitePage } from '@/lib/api'

type SiteModelView = { errors?: string[]; limitations?: string[] }
const demoPages: SitePage[] = [
  { pageKey: 'demo-home', requestedUrl: 'https://demo.example.com/', canonicalUrl: 'https://demo.example.com/', depth: 0, status: 'analyzed', redirects: [], screenshotPaths: [], stateIds: [], linksFound: 2, assetsFound: 0, assetsDownloaded: 0, assetsFailed: 0, limitations: [] },
  { pageKey: 'demo-pricing', requestedUrl: 'https://demo.example.com/pricing', canonicalUrl: 'https://demo.example.com/pricing', depth: 1, status: 'pending', redirects: [], screenshotPaths: [], stateIds: [], linksFound: 0, assetsFound: 0, assetsDownloaded: 0, assetsFailed: 0, limitations: [] },
]
const labels: Record<string, string> = { queued: 'Na fila', running: 'A analisar', paused: 'Pausada', cancelled: 'Cancelada', completed: 'Concluída', partial: 'Parcial', failed: 'Falhou', analyzed: 'Analisada', in_progress: 'Em análise', pending: 'Pendente', ignored: 'Ignorada' }
const terminal = (status: string) => ['completed', 'partial', 'failed', 'paused', 'cancelled'].includes(status)

export default function CrawlPage({ params }: { params: { id: string } }) {
  const id = params.id
  const [job, setJob] = useState<CrawlJobStatus | null>(null)
  const [pageResponse, setPageResponse] = useState<CrawlPageListResponse | null>(null)
  const [pages, setPages] = useState<SitePage[]>([])
  const [siteModel, setSiteModel] = useState<SiteModelView | null>(null)
  const [offset, setOffset] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isApiConfigured) { setLoading(false); return }
    let alive = true
    setLoading(true)
    void Promise.all([
      apiClient.getCrawlJob(id),
      apiClient.listPages(id, { offset, limit: 10 }),
      apiClient.getSiteModel(id),
    ]).then(([nextJob, nextPages, nextModel]) => {
      if (!alive) return
      setJob(nextJob)
      setPageResponse(nextPages)
      setPages(nextPages.pages)
      setSiteModel(nextModel as SiteModelView)
      setError('')
    }).catch(cause => {
      if (alive) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o rastreamento.')
    }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [id, offset, refreshKey])

  useEffect(() => {
    if (!isApiConfigured || !job || terminal(job.status)) return
    let alive = true
    const timer = setInterval(async () => {
      try {
        const latest = await apiClient.getCrawlJob(id)
        const nextPages = await apiClient.listPages(id, { offset, limit: 10 })
        if (!alive) return
        setJob(latest)
        setPageResponse(nextPages)
        setPages(nextPages.pages)
        setError('')
      } catch (cause) { if (alive) setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar o progresso.') }
    }, 2500)
    return () => { alive = false; clearInterval(timer) }
  }, [id, job?.status, offset])

  async function cancel() {
    try { await apiClient.cancelCrawlJob(id); setMessage('Cancelamento pedido; a ação de browser em curso pode terminar antes.'); setError(''); setRefreshKey(value => value + 1) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível cancelar o rastreamento.') }
  }
  async function resume() {
    try { await apiClient.resumeCrawlJob(id, job?.options ?? {}); setMessage('Retoma iniciada.'); setError(''); setRefreshKey(value => value + 1) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível retomar o rastreamento.') }
  }

  const status = job ? labels[job.status] ?? job.status : loading ? 'A carregar…' : isApiConfigured ? 'Sem dados' : 'Demonstração'
  const visiblePages = isApiConfigured ? pages : demoPages
  const progress = job?.progress
  const errors = siteModel?.errors ?? []

  return <div className="min-h-screen bg-background text-foreground">
    <header className="flex h-16 items-center gap-4 border-b border-border px-5 sm:px-8">
      <Link href="/" aria-label="Voltar à visão geral"><Button variant="ghost" size="icon"><ArrowLeft /></Button></Link>
      <div><p className="text-xs text-muted-foreground">Rastreamento / {id}</p><h1 className="font-semibold">Detalhes do rastreamento</h1></div>
      <Badge variant="secondary" className="ml-auto">{status}</Badge>
    </header>
    <main className="mx-auto max-w-6xl px-5 py-7 sm:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-2 text-sm font-medium text-primary">Tarefa de rastreamento</p><h2 className="break-all text-2xl font-semibold tracking-tight">{job?.seedUrl ?? (isApiConfigured ? 'A carregar URL…' : 'Site demonstrativo')}</h2><p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Globe2 className="size-4" />{job ? `Criada ${new Date(job.createdAt).toLocaleString()}` : 'Estado consultado pela API protegida'}</p></div>
        <div className="flex gap-2"><Button variant="outline" className="gap-2" onClick={() => setRefreshKey(value => value + 1)} disabled={loading}><RefreshCw data-icon="inline-start" /> Atualizar</Button>{job && ['queued', 'running'].includes(job.status) && <Button variant="outline" onClick={cancel}>Cancelar</Button>}{job && ['paused', 'cancelled'].includes(job.status) && <Button variant="outline" onClick={resume}>Retomar</Button>}</div>
      </div>
      {!isApiConfigured && <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/[0.06] p-4"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" /><div><p className="text-sm font-medium">Modo de demonstração visual</p><p className="mt-1 text-xs text-muted-foreground">Define NEXT_PUBLIC_API_BASE_URL na Vercel; os itens apresentados abaixo são fictícios e não representam resultados reais.</p></div></div>}
      {message && <p className="mb-4 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm text-primary" role="status">{message}</p>}
      {error && <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p>}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Summary label="Estado" value={status} /><Summary label="Descobertas" value={String(progress?.pages.discovered ?? (isApiConfigured ? 0 : demoPages.length))} /><Summary label="Processadas" value={String(progress?.pages.analyzed ?? 0)} /><Summary label="Última atualização" value={job ? new Date(job.updatedAt).toLocaleString() : '—'} /></section>
      {job && <Card className="mt-6"><CardHeader><CardTitle className="text-sm">Progresso</CardTitle></CardHeader><CardContent><div className="mb-2 flex justify-between text-xs"><span>{progress?.pages.analyzed ?? 0} páginas analisadas</span><span>{progress?.percentage ?? 0}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, Math.max(0, progress?.percentage ?? 0))}%` }} /></div><div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground"><span>Pendentes: {progress?.pages.pending ?? 0}</span><span>Assets: {progress?.assets.downloaded ?? 0}/{progress?.assets.found ?? 0}</span><span>Estados interativos: {progress?.interactions.states ?? 0}</span><span>Ramificações: {progress?.interactions.branches ?? 0}</span></div></CardContent></Card>}
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-sm">Páginas descobertas</CardTitle><p className="mt-1 text-xs text-muted-foreground">Resultados paginados fornecidos pela API.</p></div><Badge variant="outline">{pageResponse?.pagination.total ?? visiblePages.length} total</Badge></CardHeader><CardContent className="p-0"><div className="hidden grid-cols-[1.4fr_0.7fr_0.5fr_auto] gap-4 border-y border-border px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:grid"><span>Página</span><span>Estado</span><span>Profundidade</span><span /></div>{visiblePages.length ? visiblePages.map(item => <div key={item.pageKey} className="grid gap-3 border-b border-border px-5 py-4 last:border-0 sm:grid-cols-[1.4fr_0.7fr_0.5fr_auto] sm:items-center sm:gap-4"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.title || item.finalUrl || item.requestedUrl}</p><p className="truncate text-xs text-muted-foreground">{item.requestedUrl}</p></div><Badge variant={item.status === 'analyzed' ? 'default' : 'secondary'} className="w-fit text-[10px]">{labels[item.status] ?? item.status}</Badge><span className="text-xs text-muted-foreground">{item.depth}</span><Link href={`/results/${id}?page=${encodeURIComponent(item.pageKey)}`} aria-label={`Abrir resultados de ${item.title || item.requestedUrl}`}><Button variant="ghost" size="icon"><ExternalLink /></Button></Link></div>) : <Empty text={loading ? 'A carregar páginas…' : 'Ainda não existem páginas para apresentar.'} icon={<Globe2 />} />}</CardContent><div className="flex items-center justify-between border-t border-border px-5 py-3"><span className="text-xs text-muted-foreground">Offset {pageResponse?.pagination.offset ?? offset}</span><div className="flex gap-2"><Button variant="outline" size="icon" disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - 10))} aria-label="Página anterior"><ChevronLeft /></Button><Button variant="outline" size="icon" disabled={!pageResponse?.pagination.hasMore || loading} onClick={() => setOffset(offset + 10)} aria-label="Página seguinte"><ChevronRight /></Button></div></div></Card>
        <div className="flex flex-col gap-6"><Card><CardHeader><CardTitle className="text-sm">Erros do rastreamento</CardTitle></CardHeader><CardContent>{errors.length ? <ul className="list-disc space-y-2 pl-5 text-xs text-destructive">{errors.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul> : <Empty text={isApiConfigured ? 'Sem erros registados.' : 'Nenhum erro real consultado no modo de demonstração.'} icon={<AlertTriangle />} />}</CardContent></Card><Card><CardHeader><CardTitle className="text-sm">Ações rápidas</CardTitle></CardHeader><CardContent className="flex flex-col gap-2"><Link href={`/results/${id}`}><Button variant="outline" className="w-full justify-start gap-2"><FileJson2 /> Ver Page Models e resultados</Button></Link>{job && <p className="text-[11px] text-muted-foreground">O resultado é atualizado a partir do Site Model persistido.</p>}</CardContent></Card></div>
      </section>
    </main>
  </div>
}
function Summary({ label, value }: { label: string; value: string }) { return <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 break-all text-sm font-semibold">{value}</p></CardContent></Card> }
function Empty({ text, icon }: { text: string; icon?: React.ReactNode }) { return <div className="flex flex-col items-center gap-2 px-5 py-10 text-center text-xs text-muted-foreground">{icon || <Globe2 className="size-5 opacity-60" />}<p>{text}</p></div> }
