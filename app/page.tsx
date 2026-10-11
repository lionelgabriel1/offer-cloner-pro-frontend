'use client'

import {
  Activity, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown,
  CircleHelp, Clock3, FileSearch, FolderKanban, Globe2, LayoutDashboard,
  LifeBuoy, Menu, Plus, Search, Settings2, ShieldCheck, Sparkles, X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { apiClient, ApiError, isValidHttpUrl } from '@/lib/api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

type ApiState = 'unconfigured' | 'checking' | 'available' | 'unavailable'

const mainNavigation = [
  { label: 'Visão geral', href: '/', icon: LayoutDashboard },
  { label: 'Análises', href: '/crawls', icon: FileSearch },
  { label: 'Projetos', href: '/projects', icon: FolderKanban },
]
const supportNavigation = [
  { label: 'Documentação', href: '/documentation', icon: BookOpen },
  { label: 'Definições', href: '/settings', icon: Settings2 },
]

export default function Page() {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [formNotice, setFormNotice] = useState('')
  const [apiNotice, setApiNotice] = useState('')
  const [apiState, setApiState] = useState<ApiState>(apiClient.configured ? 'checking' : 'unconfigured')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!apiClient.configured) {
      setApiState('unconfigured')
      return
    }
    apiClient.checkHealth()
      .then((health) => setApiState(health.ok ? 'available' : 'unavailable'))
      .catch(() => setApiState('unavailable'))
  }, [])

  async function startAnalysis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormNotice('')
    let parsedUrl: URL
    try {
      if (!isValidHttpUrl(url)) throw new Error('invalid-url')
      parsedUrl = new URL(url.trim())
    } catch {
      setFormNotice('Introduz um endereço válido que comece por https:// ou http://.')
      return
    }
    if (!apiClient.configured) {
      setFormNotice('O backend ainda não está configurado neste frontend. Define NEXT_PUBLIC_API_BASE_URL para continuar.')
      return
    }
    setStarting(true)
    try {
      const job = await apiClient.createCrawlJob(parsedUrl.toString())
      router.push(`/crawls/${job.jobId}`)
    } catch (error) {
      setFormNotice(error instanceof ApiError ? error.message : 'Não foi possível criar a análise. Verifica a ligação ao backend e tenta novamente.')
    } finally {
      setStarting(false)
    }
  }

  function navigate(href: string, _label?: string) {
    router.push(href)
    setMobileOpen(false)
  }

  const apiLabel = {
    unconfigured: 'Não configurada',
    checking: 'A verificar',
    available: 'Respondeu',
    unavailable: 'Sem resposta',
  }[apiState]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {mobileOpen && <button className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col border-r border-border bg-sidebar transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[76px] items-center gap-3 px-5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Sparkles className="size-[18px]" /></div>
          <div className="min-w-0"><p className="text-[14px] font-semibold tracking-tight">Offer Cloner <span className="text-muted-foreground">Pro</span></p><p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Workspace</p></div>
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"><X className="size-4" /></Button>
        </div>
        <Separator />
        <div className="flex flex-1 flex-col px-3 py-5">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>
          <nav className="space-y-1" aria-label="Navegação principal">
            {mainNavigation.map((item) => {
              const Icon = item.icon
              const active = item.href === '/'
              return <button key={item.href} onClick={() => navigate(item.href, item.label)} className={`group flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] transition-colors ${active ? 'bg-sidebar-accent text-foreground' : 'text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground'}`}><Icon className={`size-[17px] ${active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} /><span className={active ? 'font-medium' : 'font-normal'}>{item.label}</span>{active && <span className="ml-auto size-1.5 rounded-full bg-foreground" />}</button>
            })}
          </nav>
          <p className="px-3 pb-2 pt-8 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ajuda e configuração</p>
          <nav className="space-y-1" aria-label="Ajuda e configuração">
            {supportNavigation.map((item) => {
              const Icon = item.icon
              return <button key={item.href} onClick={() => navigate(item.href, item.label)} className="group flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground"><Icon className="size-[17px]" />{item.label}</button>
            })}
          </nav>
          <div className="mt-auto rounded-xl border border-border bg-card/60 p-4">
            <div className="flex items-center justify-between"><span className="text-xs font-medium">Ligação ao backend</span><span className={`size-2 rounded-full ${apiState === 'available' ? 'bg-emerald-400' : apiState === 'checking' ? 'bg-amber-400' : 'bg-muted-foreground/50'}`} /></div>
            <p className="mt-2 text-xs text-muted-foreground">{apiLabel}. O estado é baseado apenas no endpoint de saúde.</p>
            <button onClick={() => setApiNotice('Verifica NEXT_PUBLIC_API_BASE_URL e confirma se o backend do Manus está acessível. O endpoint /health não valida o fluxo completo de captura.')} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline">Ver configuração <ArrowUpRight className="size-3" /></button>
          </div>
        </div>
        <Separator />
        <button onClick={() => setApiNotice('A gestão de conta e permissões será ligada à autenticação existente.')} className="flex items-center gap-3 px-5 py-4 text-left hover:bg-sidebar-accent/40">
          <Avatar className="size-9"><AvatarFallback className="bg-muted text-xs font-semibold">OC</AvatarFallback></Avatar>
          <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">A tua conta</span><span className="mt-0.5 block truncate text-[11px] text-muted-foreground">Workspace pessoal</span></span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      </aside>

      <div className="min-w-0 lg:pl-[258px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border/80 bg-background/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Menu className="size-4" /></Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><span>Workspace</span><span className="text-border">/</span><span className="text-foreground">Visão geral</span></div>
          </div>
          <div className="flex items-center gap-2">
            
            <Button variant="outline" size="sm" className="hidden gap-2 sm:inline-flex" onClick={() => router.push('/documentation')}><CircleHelp className="size-3.5" /> Ajuda</Button>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-5 pb-12 pt-8 sm:px-8 sm:pt-10">
          {apiNotice && <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3.5 text-sm text-muted-foreground" role="status"><p>{apiNotice}</p><button onClick={() => setApiNotice('')} className="shrink-0 text-xs font-medium text-foreground hover:underline">Fechar</button></div>}

          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground"><span className="size-1.5 rounded-full bg-foreground/70" /> Plataforma de reconstrução web</div><h1 className="text-[28px] font-semibold tracking-[-0.04em] sm:text-[34px]">Visão geral</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Analisa páginas públicas, acompanha a captura e prepara uma versão editável da tua oferta.</p></div>
            <Badge variant="outline" className="w-fit gap-2 rounded-full px-3 py-1.5 text-xs font-normal text-muted-foreground"><span className={`size-1.5 rounded-full ${apiState === 'available' ? 'bg-emerald-400' : apiState === 'checking' ? 'bg-amber-400' : 'bg-muted-foreground/60'}`} /> Backend: {apiLabel}</Badge>
          </div>

          <section aria-labelledby="new-analysis-title" className="relative overflow-hidden rounded-2xl border border-border bg-card">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.055),transparent_48%)]" />
            <div className="relative grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)] lg:gap-10 lg:p-10">
              <div className="flex flex-col justify-center">
                <div className="mb-5 flex size-11 items-center justify-center rounded-xl border border-border bg-background"><Globe2 className="size-5" /></div>
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Nova captura</p>
                <h2 id="new-analysis-title" className="mt-2 text-2xl font-semibold tracking-[-0.035em] sm:text-[28px]">Começa com um URL.</h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Introduz a página que tens autorização para analisar. O sistema criará um job de captura no backend.</p>
                <form onSubmit={startAnalysis} className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <label htmlFor="source-url" className="sr-only">URL da página</label>
                  <div className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-lg border border-input bg-background px-3.5 focus-within:ring-2 focus-within:ring-ring/50"><Globe2 className="size-4 shrink-0 text-muted-foreground" /><input id="source-url" type="url" autoComplete="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://teusite.com/oferta" className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /></div>
                  <Button type="submit" disabled={starting} className="h-12 gap-2 px-5">{starting ? 'A criar captura…' : <>Analisar página <ArrowRight className="size-4" /></>}</Button>
                </form>
                {formNotice && <p role="status" className="mt-3 text-xs leading-5 text-muted-foreground">{formNotice}</p>}
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground"><ShieldCheck className="size-3.5" /> Usa apenas páginas públicas que tens autorização para reproduzir.</p>
              </div>
              <div className="flex flex-col justify-center gap-3 border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Como funciona</p>
                <ProcessStep number="01" title="Captura" description="Abre a página num Chromium real e recolhe a estrutura renderizada." />
                <ProcessStep number="02" title="Reconstrução" description="Organiza elementos e estilos num modelo editável quando possível." />
                <ProcessStep number="03" title="Edição e exportação" description="Revê o resultado, ajusta componentes e prepara o projeto." last />
              </div>
            </div>
          </section>

          <section className="mt-8" aria-labelledby="activity-title">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="activity-title" className="text-base font-semibold tracking-tight">Atividade recente</h2><p className="mt-1 text-xs text-muted-foreground">As capturas serão apresentadas aqui quando existir uma fonte real de listagem.</p></div><Button variant="outline" size="sm" className="w-fit gap-2" onClick={() => navigate('/crawls', 'Análises')}><FileSearch className="size-3.5" /> Ver análises</Button></div>
            <Card className="border-dashed bg-transparent shadow-none">
              <CardContent className="flex flex-col items-center px-6 py-12 text-center sm:py-16">
                <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-border bg-card"><Activity className="size-5 text-muted-foreground" /></div>
                <h3 className="text-sm font-medium">Ainda não há atividade para mostrar</h3>
                <p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">Não vamos preencher o painel com números de demonstração. Inicia uma captura acima; a lista de histórico será apresentada quando o backend disponibilizar o endpoint correspondente.</p>
                <Button variant="secondary" size="sm" className="mt-5 gap-2" onClick={() => document.getElementById('source-url')?.focus()}><Plus className="size-3.5" /> Criar primeira captura</Button>
              </CardContent>
            </Card>
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-2" aria-label="Estado e notas técnicas">
            <Card><CardContent className="flex gap-4 p-5"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background"><Activity className="size-4 text-muted-foreground" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-medium">Estado da ligação</h3><Badge variant="outline" className="text-[10px]">{apiLabel}</Badge></div><p className="mt-1.5 text-xs leading-5 text-muted-foreground">{apiState === 'available' ? 'O endpoint /health respondeu. Isto confirma a saúde básica do backend, não a conclusão do processo de captura.' : apiState === 'checking' ? 'A consultar o endpoint /health do backend configurado.' : apiState === 'unconfigured' ? 'Define NEXT_PUBLIC_API_BASE_URL para ligar o frontend ao backend do Manus.' : 'Não foi possível obter resposta do endpoint /health. Confirma o URL e a disponibilidade do backend.'}</p></div></CardContent></Card>
            <Card><CardContent className="flex gap-4 p-5"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background"><Clock3 className="size-4 text-muted-foreground" /></div><div><h3 className="text-sm font-medium">Sem métricas inventadas</h3><p className="mt-1.5 text-xs leading-5 text-muted-foreground">Contagem de páginas, duração média e taxa de sucesso só aparecerão quando forem fornecidas por dados reais do backend.</p></div></CardContent></Card>
          </section>

          <footer className="mt-10 flex flex-col gap-2 border-t border-border pt-5 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><p>Offer Cloner Pro <span className="mx-1.5 text-border">/</span> Interface em desenvolvimento</p><p className="flex items-center gap-1.5"><LifeBuoy className="size-3.5" /> Os recursos dependem da integração disponível no backend.</p></footer>
        </main>
      </div>
    </div>
  )
}

function ProcessStep({ number, title, description, last = false }: { number: string; title: string; description: string; last?: boolean }) {
  return <div className="flex gap-3.5">
    <div className="flex flex-col items-center"><div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-[10px] font-semibold text-muted-foreground">{number}</div>{!last && <div className="mt-2 h-full min-h-5 w-px bg-border" />}</div>
    <div className={last ? 'pb-0' : 'pb-3'}><p className="text-sm font-medium">{title}</p><p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{description}</p></div>
  </div>
}
