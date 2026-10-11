'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AlertTriangle, ArrowLeft, FileCode2, FileImage, FileText, FolderTree, Search, Server, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient, isApiConfigured, type CrawlJobStatus, type CrawlPageListResponse, type SitePage } from '@/lib/api'

const tabs = [
  { id: 'overview', label: 'Visão geral', icon: Sparkles },
  { id: 'pages', label: 'Páginas', icon: FolderTree },
  { id: 'structure', label: 'Estrutura', icon: FileCode2 },
  { id: 'screenshots', label: 'Capturas de ecrã', icon: FileImage },
  { id: 'resources', label: 'Recursos', icon: Server },
  { id: 'report', label: 'Relatório', icon: FileText },
] as const
type SiteModelView = { errors?: string[]; limitations?: string[]; interactions?: unknown[]; pages?: unknown[] }
type ArtifactAsset = Record<string, unknown> & { localPath?: string; path?: string; mimeType?: string; originalUrl?: string; downloaded?: boolean }

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>()
  const id = id
  const [active, setActive] = useState<(typeof tabs)[number]['id']>('overview')
  const [query, setQuery] = useState('')
  const [job, setJob] = useState<CrawlJobStatus | null>(null)
  const [siteModel, setSiteModel] = useState<SiteModelView | null>(null)
  const [pageResponse, setPageResponse] = useState<CrawlPageListResponse | null>(null)
  const [pages, setPages] = useState<SitePage[]>([])
  const [selectedPageKey, setSelectedPageKey] = useState('')
  const [pageModel, setPageModel] = useState<Record<string, unknown> | null>(null)
  const [pageModelError, setPageModelError] = useState('')
  const [reportFormat, setReportFormat] = useState<'json' | 'markdown'>('json')
  const [report, setReport] = useState<unknown>(null)
  const [reportError, setReportError] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isApiConfigured) { setLoading(false); return }
    let alive = true
    setLoading(true)
    void Promise.all([apiClient.getCrawlJob(id), apiClient.getSiteModel(id), apiClient.listPages(id, { offset: 0, limit: 100 })])
      .then(([nextJob, nextModel, nextPages]) => {
        if (!alive) return
        setJob(nextJob)
        setSiteModel(nextModel as SiteModelView)
        setPageResponse(nextPages)
        setPages(nextPages.pages)
        const requestedPage = typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('page') || ''
        setSelectedPageKey(nextPages.pages.some(page => page.pageKey === requestedPage) ? requestedPage : nextPages.pages[0]?.pageKey || '')
        setError('')
      }).catch(cause => { if (alive) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os resultados.') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [id])

  useEffect(() => {
    if (!isApiConfigured || !selectedPageKey) { setPageModel(null); return }
    let alive = true
    setPageModel(null)
    setPageModelError('')
    void apiClient.getPageModel(id, selectedPageKey).then(model => { if (alive) setPageModel(model) }).catch(cause => { if (alive) setPageModelError(cause instanceof Error ? cause.message : 'Page Model indisponível.') })
    return () => { alive = false }
  }, [id, selectedPageKey])

  useEffect(() => {
    if (!isApiConfigured || active !== 'report') return
    let alive = true
    setReport(null)
    setReportError('')
    void apiClient.getReport(id, reportFormat).then(value => { if (alive) setReport(value) }).catch(cause => { if (alive) setReportError(cause instanceof Error ? cause.message : 'Relatório indisponível.') })
    return () => { alive = false }
  }, [id, active, reportFormat])

  const visiblePages = useMemo(() => pages.filter(item => `${item.title ?? ''} ${item.requestedUrl}`.toLowerCase().includes(query.toLowerCase())), [pages, query])
  const selectedPage = pages.find(page => page.pageKey === selectedPageKey) ?? null
  const viewports = Array.isArray(pageModel?.viewports) ? pageModel.viewports as Array<Record<string, unknown>> : []
  const assets = Array.isArray(pageModel?.assets) ? pageModel.assets as ArtifactAsset[] : []
  const screenshotPaths = selectedPage?.screenshotPaths ?? []

  return <div className="min-h-screen bg-background text-foreground">
    <header className="flex h-16 items-center gap-4 border-b border-border px-5 sm:px-8"><Link href={`/crawls/${id}`} aria-label="Voltar ao rastreamento"><Button variant="ghost" size="icon"><ArrowLeft /></Button></Link><div><p className="text-xs text-muted-foreground">Resultados / {id}</p><h1 className="font-semibold">Resultados da análise</h1></div><Badge variant="secondary" className="ml-auto">{job ? job.status : loading ? 'A carregar…' : 'Sem dados'}</Badge></header>
    <main className="mx-auto max-w-6xl px-5 py-7 sm:px-8">
      <div className="mb-6"><p className="mb-2 text-sm font-medium text-primary">Workspace / Resultados</p><h2 className="text-2xl font-semibold tracking-tight">Explorar análise</h2><p className="mt-1 break-all text-sm text-muted-foreground">{job?.seedUrl ?? 'Os detalhes da análise aparecerão quando a API devolver dados reais.'}</p></div>
      {!isApiConfigured && <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">A API ainda não está configurada. Esta página não usa resultados de demonstração.</div>}
      {error && <p className="mb-5 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p>}
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-px" role="tablist" aria-label="Secções dos resultados">{tabs.map(tab => { const Icon = tab.icon; return <button key={tab.id} role="tab" aria-selected={active === tab.id} onClick={() => setActive(tab.id)} className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-xs font-medium transition-colors ${active === tab.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}><Icon className="size-3.5" />{tab.label}</button> })}</div>
      <section className="mt-6">
        {active === 'overview' && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Estado geral" value={job?.status ?? (loading ? 'A carregar…' : 'Sem dados')} detail={job?.finishedAt ? `Concluída ${new Date(job.finishedAt).toLocaleString()}` : `${job?.progress?.percentage ?? 0}% de progresso`} /><Stat label="Páginas" value={String(pageResponse?.pagination.total ?? 0)} detail={`${job?.progress?.pages.analyzed ?? 0} analisadas`} /><Stat label="Recursos" value={String(job?.progress?.assets.found ?? 0)} detail={`${job?.progress?.assets.downloaded ?? 0} descarregados`} /><Stat label="Relatório" value={isApiConfigured ? 'A consultar' : 'Não disponível'} detail={siteModel?.limitations?.length ? `${siteModel.limitations.length} limitações` : 'JSON e Markdown'} /></div>}
        {active === 'pages' && <Card><CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="text-sm">Páginas rastreadas</CardTitle><p className="mt-1 text-xs text-muted-foreground">Seleciona uma página para consultar o respetivo Page Model e screenshots.</p></div><div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3"><Search className="size-3.5 text-muted-foreground" /><input value={query} onChange={event => setQuery(event.target.value)} aria-label="Pesquisar páginas" placeholder="Pesquisar" className="w-32 bg-transparent text-xs outline-none placeholder:text-muted-foreground" /></div></CardHeader><CardContent className="p-0">{visiblePages.map(page => <button type="button" key={page.pageKey} onClick={() => setSelectedPageKey(page.pageKey)} className={`flex w-full items-center gap-3 border-t border-border px-5 py-4 text-left hover:bg-muted/40 ${selectedPageKey === page.pageKey ? 'bg-muted/50' : ''}`}><div className="flex size-9 items-center justify-center rounded-lg bg-muted"><FolderTree className="size-4 text-muted-foreground" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{page.title || page.finalUrl || page.requestedUrl}</p><p className="truncate text-xs text-muted-foreground">{page.requestedUrl}</p></div><Badge variant={page.status === 'analyzed' ? 'default' : 'secondary'} className="text-[10px]">{page.status}</Badge></button>)}{!visiblePages.length && <Empty title="Sem páginas" text={loading ? 'A carregar páginas…' : 'Não foram encontradas páginas para este termo.'} />}</CardContent><div className="flex items-center justify-between border-t border-border px-5 py-3"><span className="text-xs text-muted-foreground">A mostrar {visiblePages.length} de {pageResponse?.pagination.total ?? visiblePages.length} (máximo 100)</span><Link href={`/crawls/${id}`}><Button variant="outline" size="sm">Ver paginação e progresso</Button></Link></div></Card>}
        {active === 'structure' && <Card><CardHeader><CardTitle className="text-sm">Page Model da página selecionada</CardTitle><p className="text-xs text-muted-foreground">{selectedPage?.requestedUrl ?? 'Seleciona uma página no separador Páginas.'}</p></CardHeader><CardContent>{pageModelError ? <p className="text-sm text-destructive" role="alert">{pageModelError}</p> : pageModel ? <><p className="mb-3 text-xs text-muted-foreground">{viewports.length} viewport(s) persistidos. O modelo é apresentado como JSON para inspeção, sem executar HTML capturado.</p><pre className="max-h-[65vh] overflow-auto rounded-lg bg-muted p-4 text-[11px] leading-relaxed">{JSON.stringify(pageModel, null, 2)}</pre></> : <Empty title="Page Model não carregado" text={loading ? 'A carregar…' : 'Seleciona uma página analisada.'} icon={<FileCode2 />} />}</CardContent></Card>}
        {active === 'screenshots' && <div className="space-y-4"><div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold">Capturas de ecrã</h3><p className="mt-1 text-xs text-muted-foreground">{selectedPage?.requestedUrl ?? 'Seleciona uma página analisada.'}</p></div><Badge variant="outline">{screenshotPaths.length} ficheiro(s)</Badge></div>{screenshotPaths.length ? <div className="grid gap-4 md:grid-cols-2">{screenshotPaths.slice(0, 6).map(filePath => <ArtifactPreview key={filePath} jobId={id} path={filePath} image title={filePath.split('/').at(-1) || 'Screenshot'} />)}</div> : <Empty title="Ainda não existem capturas" text={isApiConfigured ? 'A página selecionada não tem screenshot persistido.' : 'As imagens serão carregadas a partir de artifacts quando a API estiver configurada.'} icon={<FileImage />} />}</div>}
        {active === 'resources' && <Card><CardHeader><CardTitle className="text-sm">Assets da página selecionada</CardTitle><p className="text-xs text-muted-foreground">Os bytes são obtidos com bearer token através do endpoint privado de artifacts.</p></CardHeader><CardContent className="space-y-3">{assets.length ? assets.map((asset, index) => { const path = typeof asset.localPath === 'string' ? asset.localPath : typeof asset.path === 'string' ? asset.path : ''; return <div key={`${path}-${index}`} className="rounded-lg border border-border p-3"><p className="break-all text-xs font-medium">{String(asset.originalUrl ?? path ?? `Asset ${index + 1}`)}</p><p className="mt-1 text-[11px] text-muted-foreground">{String(asset.mimeType ?? 'tipo desconhecido')} · {asset.downloaded === false ? 'falhou' : 'persistido'}</p>{path ? <ArtifactPreview jobId={id} path={path} image={String(asset.mimeType ?? '').startsWith('image/')} title={String(asset.originalUrl ?? path)} /> : <p className="mt-2 text-xs text-muted-foreground">Sem caminho lógico de artifact.</p>}</div> }) : <Empty title="Nenhum recurso carregado" text={pageModel ? 'O Page Model selecionado não contém assets.' : 'Seleciona uma página para consultar os assets.'} icon={<Server />} />}</CardContent></Card>}
        {active === 'report' && <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-sm">Relatório</CardTitle><p className="mt-1 text-xs text-muted-foreground">Gerado pela API a partir do estado persistido do crawl.</p></div><div className="flex gap-2"><Button size="sm" variant={reportFormat === 'json' ? 'default' : 'outline'} onClick={() => setReportFormat('json')}>JSON</Button><Button size="sm" variant={reportFormat === 'markdown' ? 'default' : 'outline'} onClick={() => setReportFormat('markdown')}>Markdown</Button></div></CardHeader><CardContent>{reportError ? <p className="text-sm text-destructive" role="alert">{reportError}</p> : report !== null ? <pre className="max-h-[65vh] overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs leading-relaxed">{typeof report === 'string' ? report : JSON.stringify(report, null, 2)}</pre> : <Empty title="Relatório não carregado" text={loading ? 'A carregar…' : 'O relatório aparecerá aqui quando a API estiver configurada.'} icon={<AlertTriangle />} />}</CardContent></Card>}
      </section>
      {siteModel?.limitations?.length ? <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4"><p className="text-sm font-medium">Limitações registadas</p><ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">{siteModel.limitations.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></div> : null}
    </main>
  </div>
}

function ArtifactPreview({ jobId, path, image, title }: { jobId: string; path: string; image: boolean; title: string }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    let alive = true
    let objectUrl = ''
    void apiClient.getArtifacts(jobId, path).then(blob => {
      if (!alive) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    }).catch(cause => { if (alive) setError(cause instanceof Error ? cause.message : 'Artifact indisponível.') })
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [jobId, path])
  if (error) return <p className="mt-2 text-xs text-destructive" role="alert">{error}</p>
  if (!url) return <p className="mt-2 text-xs text-muted-foreground">A carregar artifact privado…</p>
  return image ? <img src={url} alt={title} className="mt-3 max-h-[520px] max-w-full rounded-md border border-border object-contain" /> : <a href={url} download={path.split('/').at(-1)} className="mt-3 inline-flex text-xs text-primary underline">Transferir ficheiro</a>
}
function Stat({ label, value, detail }: { label: string; value: string; detail: string }) { return <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-3 text-2xl font-semibold">{value}</p><p className="mt-2 text-xs text-muted-foreground">{detail}</p></CardContent></Card> }
function Empty({ title, text, icon }: { title: string; text: string; icon?: React.ReactNode }) { return <div className="flex flex-col items-center gap-2 py-16 text-center"><div className="rounded-full bg-muted p-3 text-muted-foreground">{icon || <FileText className="size-5" />}</div><p className="text-sm font-medium">{title}</p><p className="max-w-md text-xs text-muted-foreground">{text}</p></div> }
