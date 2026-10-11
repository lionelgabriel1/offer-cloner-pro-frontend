'use client'

import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  CircleHelp,
  Clock3,
  Code2,
  FileJson2,
  FolderKanban,
  Gauge,
  Globe2,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiClient, ApiError, isValidHttpUrl } from '@/lib/api'
import type { FormEvent } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const navigation = [
  { label: 'Visão geral', icon: LayoutDashboard, active: true },
  { label: 'Análises', icon: Activity },
  { label: 'Projetos', icon: FolderKanban },
  { label: 'Page Models', icon: FileJson2 },
  { label: 'Relatórios', icon: BarChart3 },
]

const secondaryNavigation = [
  { label: 'Documentação', icon: BookOpen },
  { label: 'Definições', icon: Settings2 },
]

const recentAnalyses: Array<{ name: string; url: string; status: string; pages: string; date: string; tone: 'success' | 'warning' | 'neutral' }> = []

export default function Page() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [newAnalysisOpen, setNewAnalysisOpen] = useState(false)
  const [analysisUrl, setAnalysisUrl] = useState('')
  const [demoNotice, setDemoNotice] = useState('')
  const [actionNotice, setActionNotice] = useState('')
  const [apiState, setApiState] = useState<'unconfigured' | 'checking' | 'available' | 'unavailable'>(apiClient.configured ? 'checking' : 'unconfigured')
  const [isStartingAnalysis, setIsStartingAnalysis] = useState(false)

  useEffect(() => {
    if (!apiClient.configured) {
      setApiState('unconfigured')
      return
    }
    apiClient.checkHealth().then((health) => setApiState(health.ok ? 'available' : 'unavailable')).catch(() => setApiState('unavailable'))
  }, [])
  const router = useRouter()

  function handleAction(message: string) {
    setActionNotice(message)
  }

  async function handleStartAnalysis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDemoNotice('')
    let url: URL
    try {
      if (!isValidHttpUrl(analysisUrl)) throw new Error('invalid')
      url = new URL(analysisUrl.trim())
    } catch {
      setDemoNotice('Introduz um URL válido, começando por http:// ou https://.')
      return
    }
    if (!apiClient.configured) {
      setDemoNotice('A API não está configurada. Nenhum pedido foi enviado.')
      return
    }
    setIsStartingAnalysis(true)
    try {
      const created = await apiClient.createCrawlJob(url.toString())
      router.push(`/crawls/${created.jobId}`)
    } catch (error) {
      setDemoNotice(error instanceof ApiError ? error.message : 'Não foi possível iniciar o rastreamento.')
    } finally {
      setIsStartingAnalysis(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-sidebar transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Offer Cloner</p>
              <p className="text-[11px] text-muted-foreground">PRO WORKSPACE</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu">
            <X />
          </Button>
        </div>
        <Separator />
        <div className="flex flex-1 flex-col px-3 py-5">
          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>
          <nav className="flex flex-col gap-1" aria-label="Navegação principal">
            {navigation.map((item) => (
              <button key={item.label} onClick={() => item.label === 'Visão geral' ? router.push('/') : item.label === 'Análises' || item.label === 'Page Models' || item.label === 'Relatórios' ? handleAction(`${item.label}: inicia primeiro um rastreamento real para consultar estes dados.`) : handleAction(`${item.label}: disponível quando a API real estiver ligada.`)} className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${item.active ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'}`}>
                <item.icon className="size-4" />
                {item.label}
                {item.label === 'Análises' && <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">2</span>}
              </button>
            ))}
          </nav>
          <p className="px-3 pb-3 pt-8 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Recursos</p>
          <nav className="flex flex-col gap-1" aria-label="Recursos">
            {secondaryNavigation.map((item) => (
              <button key={item.label} onClick={() => item.label === 'Documentação' ? router.push('/documentation') : router.push('/settings')} className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground">
                <item.icon className="size-4" />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded-xl border border-border bg-background/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium">Plano Pro</span>
              <Badge variant="secondary" className="text-[10px]">ATIVO</Badge>
            </div>
            <div className="mb-2 flex items-end justify-between text-xs">
              <span className="text-muted-foreground">Crawls este mês</span>
              <span className="font-medium">12 / 50</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full w-1/4 rounded-full bg-primary" /></div>
            <button onClick={() => handleAction('Gestão de subscrição disponível quando o billing estiver configurado.')} className="mt-3 text-xs font-medium text-primary hover:underline">Gerir subscrição <ArrowUpRight className="ml-1 inline size-3" /></button>
          </div>
        </div>
        <Separator />
        <div className="flex items-center gap-3 px-5 py-4">
          <Avatar className="size-8"><AvatarFallback>LM</AvatarFallback></Avatar>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">Lara Martins</p><p className="truncate text-xs text-muted-foreground">lara@studio.pt</p></div>
          <ChevronDown className="size-4 text-muted-foreground" />
        </div>
      </aside>

      {mobileOpen && <button className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" />}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Menu /></Button>
            <div><p className="text-sm text-muted-foreground">Quarta-feira, 16 de Outubro</p><h1 className="text-lg font-semibold tracking-tight">Visão geral</h1></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground md:flex"><Search className="size-3.5" /><span>Pesquisar</span><kbd className="ml-5 rounded border border-border bg-background px-1.5 py-0.5 text-[10px]">⌘ K</kbd></div>
            <Button variant="ghost" size="icon" aria-label="Notificações" onClick={() => handleAction('Não existem notificações novas neste modo de demonstração.')}><Bell className="size-4" /><span className="absolute ml-4 mt-[-14px] size-1.5 rounded-full bg-primary" /></Button>
            <Button variant="outline" size="sm" className="hidden gap-2 sm:flex" onClick={() => handleAction('A ajuda estará disponível quando a integração for configurada.')}><CircleHelp className="size-4" /> Ajuda</Button>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9">
          {actionNotice && <div className="mb-5 flex items-center justify-between rounded-lg border border-primary/25 bg-primary/[0.06] px-4 py-3 text-xs text-primary" role="status"><span>{actionNotice}</span><button onClick={() => setActionNotice('')} className="ml-4 font-medium hover:underline" aria-label="Fechar aviso">Fechar</button></div>}
          {newAnalysisOpen && <Card className="mb-7 border-primary/30 bg-primary/[0.04]"><CardHeader className="flex flex-row items-start justify-between gap-4 px-5 py-4 sm:px-6"><div><CardTitle className="text-sm font-semibold">Iniciar nova análise</CardTitle><p className="mt-1 text-xs text-muted-foreground">Introduz um URL autorizado para preparar o rastreamento.</p></div><Button variant="ghost" size="icon" onClick={() => setNewAnalysisOpen(false)} aria-label="Fechar nova análise"><X /></Button></CardHeader><CardContent className="px-5 pb-5 sm:px-6"><form className="flex flex-col gap-3 sm:flex-row" onSubmit={(event: FormEvent<HTMLFormElement>) => handleStartAnalysis(event)}><input aria-label="URL do site" value={analysisUrl} onChange={(event) => setAnalysisUrl(event.target.value)} placeholder="https://exemplo.pt" className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2" /><Button type="submit" className="gap-2" disabled={isStartingAnalysis}>{isStartingAnalysis ? 'A iniciar…' : <><Globe2 className="size-4" /> Iniciar análise</>}</Button></form>{demoNotice && <p className="mt-3 text-xs text-primary" role="status">{demoNotice}</p>}<p className="mt-3 text-[11px] text-muted-foreground">Demonstração visual: nenhum pedido foi enviado porque a API ainda não está configurada.</p></CardContent></Card>}
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm font-medium text-primary">Workspace pessoal</p><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Bom dia, Lara.</h2><p className="mt-1 text-sm text-muted-foreground">Aqui está o resumo das tuas análises autorizadas.</p></div><Button className="w-full gap-2 sm:w-auto" onClick={() => { setNewAnalysisOpen(true); setDemoNotice('') }}><Plus className="size-4" /> Nova análise</Button></div>

          <div className="mb-7 rounded-xl border border-primary/20 bg-primary/[0.06] px-4 py-3 sm:flex sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className="mt-0.5 rounded-full bg-primary/10 p-1.5 text-primary"><ShieldCheck className="size-4" /></div><div><p className="text-sm font-medium">{apiState === 'unconfigured' ? 'API não configurada' : apiState === 'checking' ? 'A verificar a API' : apiState === 'available' ? 'API disponível' : 'API indisponível'}</p><p className="mt-0.5 text-xs text-muted-foreground">{apiState === 'available' ? 'O endpoint /health respondeu positivamente. O rastreamento completo ainda não foi validado.' : apiState === 'checking' ? 'A confirmar a disponibilidade real do endpoint /health.' : apiState === 'unconfigured' ? 'Configura a API para activar pedidos reais. Os valores abaixo são dados fictícios.' : 'O endpoint /health não está disponível. Os valores abaixo são dados fictícios.'}</p></div></div><button onClick={() => handleAction('Configuração necessária: NEXT_PUBLIC_API_BASE_URL e credenciais Supabase.')} className="mt-3 pl-11 text-xs font-medium text-primary hover:underline sm:mt-0 sm:pl-0">Configurar integração <ArrowUpRight className="ml-1 inline size-3" /></button></div>

          <section className="grid gap-4" aria-label="Resumo de métricas"><Card><CardContent className="flex items-start gap-3 p-5"><Activity className="mt-0.5 size-4 text-muted-foreground" /><div><p className="text-sm font-medium">Sem métricas disponíveis</p><p className="mt-1 text-xs text-muted-foreground">O backend não disponibiliza uma listagem agregada de projectos ou jobs. Inicia um rastreamento para consultar dados reais.</p></div></CardContent></Card></section>

          <section className="mt-7 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
            <Card><CardHeader><CardTitle className="text-sm font-semibold">Atividade de análises</CardTitle><p className="mt-1 text-xs text-muted-foreground">Sem dados agregados disponíveis no contrato actual da API.</p></CardHeader><CardContent><div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">O backend disponibiliza o estado e o progresso de cada Crawl Job, mas não um histórico agregado para este gráfico.</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between px-5 py-4 sm:px-6"><div><CardTitle className="text-sm font-semibold">Estado do workspace</CardTitle><p className="mt-1 text-xs text-muted-foreground">Saúde operacional das tuas análises</p></div><button onClick={() => handleAction('Mais opções do workspace disponíveis no modo real.')} aria-label="Mais opções do workspace"><MoreHorizontal className="size-4 text-muted-foreground" /></button></CardHeader><CardContent className="px-5 pb-5 sm:px-6"><div className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-4"><div className="relative flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary"><Activity className="size-5" /><span className={`absolute right-0 top-0 size-2.5 rounded-full border-2 border-card ${apiState === 'available' ? 'bg-primary' : 'bg-muted-foreground/50'}`} /></div><div><p className="text-sm font-medium">{apiState === 'unconfigured' ? 'API não configurada' : apiState === 'checking' ? 'A verificar sistemas' : apiState === 'available' ? 'API disponível' : 'API indisponível'}</p><p className="mt-1 text-xs text-muted-foreground">{apiState === 'checking' ? 'A consultar /health…' : apiState === 'available' ? 'Confirmado pelo endpoint /health' : apiState === 'unconfigured' ? 'Configuração em falta' : 'Sem resposta do backend'}</p></div></div><div className="mt-5 flex flex-col gap-4"><StatusRow label="Crawler API" value={apiState === 'unconfigured' ? 'Não configurada' : apiState === 'checking' ? 'A verificar' : apiState === 'available' ? 'Disponível' : 'Indisponível'} muted={apiState !== 'available'} /><StatusRow label="Captura de páginas" value={apiState === 'unconfigured' ? 'Não configurada' : apiState === 'checking' ? 'A verificar' : apiState === 'available' ? 'Disponível' : 'Indisponível'} muted={apiState !== 'available'} /><StatusRow label="Armazenamento" value="Não verificado" muted /></div><Separator className="my-5" /><div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-3.5" /> Tempo de resposta médio <span className="ml-auto font-medium text-foreground">—</span></div></CardContent></Card>
          </section>

          <section className="mt-7"><div className="mb-4 flex items-center justify-between"><div><h3 className="text-sm font-semibold">Análises recentes</h3><p className="mt-1 text-xs text-muted-foreground">Os jobs reais aparecem depois de iniciares um rastreamento.</p></div></div><Card><CardContent className="p-0">{recentAnalyses.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Ainda não existem análises reais para este workspace.</div> : <><div className="hidden grid-cols-[1.5fr_1fr_0.7fr_0.8fr_auto] gap-4 border-b border-border px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:grid sm:px-6"><span>Análise</span><span>Estado</span><span>Páginas</span><span>Data</span><span /></div>{recentAnalyses.map((analysis) => <div key={analysis.name} className="grid gap-3 border-b border-border px-5 py-4 last:border-0 sm:grid-cols-[1.5fr_1fr_0.7fr_0.8fr_auto] sm:items-center sm:gap-4 sm:px-6"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Globe2 className="size-4" /></div><div><p className="text-sm font-medium">{analysis.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{analysis.url}</p></div></div><div><Badge variant={analysis.tone === 'success' ? 'default' : 'secondary'} className="gap-1.5 text-[10px]">{analysis.tone === 'success' && <span className="size-1.5 rounded-full bg-primary-foreground" />}{analysis.tone === 'warning' && <span className="size-1.5 rounded-full bg-foreground/50" />}{analysis.status}</Badge></div><p className="text-xs text-muted-foreground">{analysis.pages}</p><p className="text-xs text-muted-foreground">{analysis.date}</p><Button variant="ghost" size="icon" aria-label={`Abrir ${analysis.name}`} onClick={() => analysis.tone === 'success' ? router.push('/results/demo-job') : handleAction(`${analysis.name}: acompanhamento disponível quando a API estiver ligada.`)}><ArrowUpRight className="size-4" /></Button></div>)}</>}</CardContent></Card></section>

          <footer className="mt-10 flex flex-col gap-2 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><p>Offer Cloner Pro · Frontend em construção</p><div className="flex items-center gap-4"><span className="flex items-center gap-1.5"><Code2 className="size-3.5" /> {apiState === 'unconfigured' ? 'API não configurada' : apiState === 'checking' ? 'A verificar API' : apiState === 'available' ? 'API disponível' : 'API indisponível'}</span><span>v0.1.0</span></div></footer>
        </main>
      </div>
    </div>
  )
}

function MetricCard({ label, value, change, detail, icon: Icon }: { label: string; value: string; change: string; detail: string; icon: typeof Globe2 }) {
  return <Card><CardContent className="p-5"><div className="flex items-start justify-between"><p className="text-xs font-medium text-muted-foreground">{label}</p><div className="rounded-lg bg-muted p-2 text-muted-foreground"><Icon className="size-4" /></div></div><p className="mt-5 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-2 text-xs text-muted-foreground"><span className="font-medium text-primary">{change}</span> <span className="ml-1">{detail}</span></p></CardContent></Card>
}

function StatusRow({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className={`flex items-center gap-2 font-medium ${muted ? 'text-muted-foreground' : 'text-foreground'}`}><span className={`size-1.5 rounded-full ${muted ? 'bg-muted-foreground/50' : 'bg-primary'}`} />{value}</span></div>
}
