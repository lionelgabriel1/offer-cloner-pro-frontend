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
import { useState } from 'react'
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

const recentAnalyses = [
  { name: 'Landing Page · Acme', url: 'acme-example.com', status: 'Concluída', pages: '24 páginas', date: 'Hoje, 10:42', tone: 'success' },
  { name: 'Product Hunt · SaaS', url: 'saas-example.com', status: 'A analisar', pages: '18 / 32 páginas', date: 'Hoje, 09:18', tone: 'warning' },
  { name: 'Checkout · Commerce', url: 'commerce-example.com', status: 'Pausada', pages: '8 páginas', date: 'Ontem, 16:05', tone: 'neutral' },
]

const bars = [38, 52, 44, 68, 57, 82, 70, 91, 64, 76, 88, 72, 96, 82, 100, 86]

export default function Page() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [newAnalysisOpen, setNewAnalysisOpen] = useState(false)
  const [analysisUrl, setAnalysisUrl] = useState('')
  const [demoNotice, setDemoNotice] = useState('')

  function handleStartAnalysis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!analysisUrl.trim()) return
    setDemoNotice('Pedido preparado. A API será chamada quando VITE_API_BASE_URL estiver configurada.')
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
              <button key={item.label} className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${item.active ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'}`}>
                <item.icon className="size-4" />
                {item.label}
                {item.label === 'Análises' && <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">2</span>}
              </button>
            ))}
          </nav>
          <p className="px-3 pb-3 pt-8 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Recursos</p>
          <nav className="flex flex-col gap-1" aria-label="Recursos">
            {secondaryNavigation.map((item) => (
              <button key={item.label} className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground">
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
            <button className="mt-3 text-xs font-medium text-primary hover:underline">Gerir subscrição <ArrowUpRight className="ml-1 inline size-3" /></button>
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
            <Button variant="ghost" size="icon" aria-label="Notificações"><Bell className="size-4" /><span className="absolute ml-4 mt-[-14px] size-1.5 rounded-full bg-primary" /></Button>
            <Button variant="outline" size="sm" className="hidden gap-2 sm:flex"><CircleHelp className="size-4" /> Ajuda</Button>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9">
          {newAnalysisOpen && <Card className="mb-7 border-primary/30 bg-primary/[0.04]"><CardHeader className="flex flex-row items-start justify-between gap-4 px-5 py-4 sm:px-6"><div><CardTitle className="text-sm font-semibold">Iniciar nova análise</CardTitle><p className="mt-1 text-xs text-muted-foreground">Introduz um URL autorizado para preparar o rastreamento.</p></div><Button variant="ghost" size="icon" onClick={() => setNewAnalysisOpen(false)} aria-label="Fechar nova análise"><X /></Button></CardHeader><CardContent className="px-5 pb-5 sm:px-6"><form className="flex flex-col gap-3 sm:flex-row" onSubmit={(event: FormEvent<HTMLFormElement>) => handleStartAnalysis(event)}><input aria-label="URL do site" value={analysisUrl} onChange={(event) => setAnalysisUrl(event.target.value)} placeholder="https://exemplo.pt" className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2" /><Button type="submit" className="gap-2"><Globe2 className="size-4" /> Preparar análise</Button></form>{demoNotice && <p className="mt-3 text-xs text-primary" role="status">{demoNotice}</p>}<p className="mt-3 text-[11px] text-muted-foreground">Demonstração visual: nenhum pedido foi enviado porque a API ainda não está configurada.</p></CardContent></Card>}
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-sm font-medium text-primary">Workspace pessoal</p><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Bom dia, Lara.</h2><p className="mt-1 text-sm text-muted-foreground">Aqui está o resumo das tuas análises autorizadas.</p></div><Button className="w-full gap-2 sm:w-auto" onClick={() => { setNewAnalysisOpen(true); setDemoNotice('') }}><Plus className="size-4" /> Nova análise</Button></div>

          <div className="mb-7 rounded-xl border border-primary/20 bg-primary/[0.06] px-4 py-3 sm:flex sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className="mt-0.5 rounded-full bg-primary/10 p-1.5 text-primary"><ShieldCheck className="size-4" /></div><div><p className="text-sm font-medium">Modo de demonstração visual</p><p className="mt-0.5 text-xs text-muted-foreground">A API ainda não está ligada. Os valores abaixo são dados de demonstração e não representam análises reais.</p></div></div><button className="mt-3 pl-11 text-xs font-medium text-primary hover:underline sm:mt-0 sm:pl-0">Configurar integração <ArrowUpRight className="ml-1 inline size-3" /></button></div>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo de métricas">
            <MetricCard label="Análises totais" value="24" change="+18,2%" detail="vs. mês anterior" icon={Globe2} />
            <MetricCard label="Páginas rastreadas" value="1.284" change="+12,5%" detail="nos últimos 30 dias" icon={Target} />
            <MetricCard label="Page Models" value="86" change="+8,1%" detail="modelos capturados" icon={FileJson2} />
            <MetricCard label="Tempo médio" value="2m 48s" change="-14,6%" detail="por análise" icon={Gauge} />
          </section>

          <section className="mt-7 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
            <Card className="overflow-hidden"><CardHeader className="flex flex-row items-center justify-between border-b border-border/70 px-5 py-4 sm:px-6"><div><CardTitle className="text-sm font-semibold">Atividade de análises</CardTitle><p className="mt-1 text-xs text-muted-foreground">Volume de páginas processadas</p></div><Button variant="outline" size="sm" className="hidden sm:flex">Últimos 30 dias <ChevronDown className="ml-2 size-3.5" /></Button></CardHeader><CardContent className="px-5 py-6 sm:px-6"><div className="flex items-end justify-between"><div><p className="text-3xl font-semibold tracking-tight">1.284</p><p className="mt-1 text-xs text-muted-foreground"><span className="font-medium text-primary">+12,5%</span> em relação ao período anterior</p></div><div className="rounded-lg bg-primary/10 p-2 text-primary"><BarChart3 className="size-4" /></div></div><div className="mt-7 flex h-36 items-end gap-1.5 sm:gap-2">{bars.map((height, index) => <div key={index} className="group relative flex h-full flex-1 items-end"><div className={`w-full rounded-t-sm transition-colors ${index === bars.length - 2 ? 'bg-primary' : 'bg-primary/20 group-hover:bg-primary/50'}`} style={{ height: `${height}%` }} /></div>)}</div><div className="mt-3 flex justify-between text-[10px] text-muted-foreground"><span>18 Set</span><span>25 Set</span><span>02 Out</span><span>09 Out</span><span>16 Out</span></div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between px-5 py-4 sm:px-6"><div><CardTitle className="text-sm font-semibold">Estado do workspace</CardTitle><p className="mt-1 text-xs text-muted-foreground">Saúde operacional das tuas análises</p></div><MoreHorizontal className="size-4 text-muted-foreground" /></CardHeader><CardContent className="px-5 pb-5 sm:px-6"><div className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-4"><div className="relative flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary"><Activity className="size-5" /><span className="absolute right-0 top-0 size-2.5 rounded-full border-2 border-card bg-primary" /></div><div><p className="text-sm font-medium">Todos os sistemas operacionais</p><p className="mt-1 text-xs text-muted-foreground">Última verificação há 2 min</p></div></div><div className="mt-5 flex flex-col gap-4"><StatusRow label="Crawler API" value="Operacional" /><StatusRow label="Captura de páginas" value="Operacional" /><StatusRow label="Armazenamento" value="Não configurado" muted /></div><Separator className="my-5" /><div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-3.5" /> Tempo de resposta médio <span className="ml-auto font-medium text-foreground">—</span></div></CardContent></Card>
          </section>

          <section className="mt-7"><div className="mb-4 flex items-center justify-between"><div><h3 className="text-sm font-semibold">Análises recentes</h3><p className="mt-1 text-xs text-muted-foreground">Acompanha as últimas análises do teu workspace</p></div><button className="text-xs font-medium text-primary hover:underline">Ver todas <ArrowUpRight className="ml-1 inline size-3" /></button></div><Card><CardContent className="p-0"><div className="hidden grid-cols-[1.5fr_1fr_0.7fr_0.8fr_auto] gap-4 border-b border-border px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:grid sm:px-6"><span>Análise</span><span>Estado</span><span>Páginas</span><span>Data</span><span /></div>{recentAnalyses.map((analysis) => <div key={analysis.name} className="grid gap-3 border-b border-border px-5 py-4 last:border-0 sm:grid-cols-[1.5fr_1fr_0.7fr_0.8fr_auto] sm:items-center sm:gap-4 sm:px-6"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Globe2 className="size-4" /></div><div><p className="text-sm font-medium">{analysis.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{analysis.url}</p></div></div><div><Badge variant={analysis.tone === 'success' ? 'default' : 'secondary'} className="gap-1.5 text-[10px]">{analysis.tone === 'success' && <span className="size-1.5 rounded-full bg-primary-foreground" />}{analysis.tone === 'warning' && <span className="size-1.5 rounded-full bg-foreground/50" />}{analysis.status}</Badge></div><p className="text-xs text-muted-foreground">{analysis.pages}</p><p className="text-xs text-muted-foreground">{analysis.date}</p><Button variant="ghost" size="icon" aria-label={`Abrir ${analysis.name}`}><ArrowUpRight className="size-4" /></Button></div>)}</CardContent></Card></section>

          <footer className="mt-10 flex flex-col gap-2 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><p>Offer Cloner Pro · Frontend em construção</p><div className="flex items-center gap-4"><span className="flex items-center gap-1.5"><Code2 className="size-3.5" /> API não ligada</span><span>v0.1.0</span></div></footer>
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
