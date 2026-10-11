'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowLeft, Check, ChevronDown, ChevronRight, Eye, Monitor, Save, Search, Smartphone, Tablet, Undo2, Redo2, Layers3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { apiClient, isApiConfigured, type EditorDomNode, type PageModel } from '@/lib/api'

type VisualNode = EditorDomNode & { children?: VisualNode[] }
type Viewport = 'desktop' | 'tablet' | 'mobile'

const labelForNode = (node: VisualNode) => {
  const tagLabels: Record<string, string> = { main: 'Página', section: 'Secção', h1: 'Título principal', h2: 'Título', h3: 'Subtítulo', p: 'Texto', img: 'Imagem', button: 'Botão', form: 'Formulário', video: 'Vídeo', nav: 'Navegação', footer: 'Rodapé' }
  return tagLabels[node.tag.toLowerCase()] ?? node.text?.trim() ?? node.id ?? 'Elemento'
}

const childrenOf = (node: VisualNode) => Array.isArray(node.children) ? node.children : []

export default function EditorPage({ params }: { params: { id: string } }) {
  const [model, setModel] = useState<PageModel | null>(null)
  const [savedModel, setSavedModel] = useState<PageModel | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'saved' | 'error'>('loading')
  const [error, setError] = useState('')
  const [undoStack, setUndoStack] = useState<PageModel[]>([])
  const [future, setFuture] = useState<PageModel[]>([])

  useEffect(() => {
    let active = true
    if (!isApiConfigured) { setError('A API não está configurada. Não é possível abrir um modelo real.'); setStatus('error'); return () => { active = false } }
    apiClient.getProjectEditor(params.id).then((response) => {
      if (!active) return
      setModel(response.model); setSavedModel(response.model); setSelectedId((response.model.viewports.find((item) => item.kind === 'desktop')?.dom as VisualNode | undefined)?.uid ?? ''); setStatus('ready')
    }).catch((cause: unknown) => { if (active) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o modelo.'); setStatus('error') } })
    return () => { active = false }
  }, [params.id])

  const root = useMemo(() => {
    const viewportRoot = model?.viewports.find((item) => item.kind === viewport)?.dom as VisualNode | undefined
    return viewportRoot
  }, [model, viewport])
  const selectedNode = useMemo(() => {
    if (!root) return null
    const find = (node: VisualNode): VisualNode | null => node.uid === selectedId ? node : childrenOf(node).map(find).find(Boolean) ?? null
    return find(root)
  }, [root, selectedId])
  const dirty = JSON.stringify(model) !== JSON.stringify(savedModel)

  const updateText = (value: string) => {
    if (!model || !selectedNode) return
    setUndoStack((items) => [...items.slice(-19), model]); setFuture([])
    const next = structuredClone(model) as PageModel
    const target = next.viewports.find((item) => item.kind === viewport)?.dom as VisualNode | undefined
    const update = (node: VisualNode): boolean => { if (node.uid === selectedNode.uid) { node.text = value; return true }; return childrenOf(node).some(update) }
    if (target) update(target)
    setModel(next)
  }

  const save = async () => {
    if (!model || !dirty) return
    setStatus('saving'); setError('')
    try { const response = await apiClient.updateProjectEditor(params.id, model); setModel(response.model); setSavedModel(response.model); setStatus('saved') } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : 'Não foi possível guardar as alterações.'); setStatus('error') }
  }
  const undo = () => { const previous = undoStack.at(-1); if (!previous || !model) return; setFuture((items) => [model, ...items]); setUndoStack((items) => items.slice(0, -1)); setModel(previous) }
  const redo = () => { const next = future[0]; if (!next || !model) return; setUndoStack((items) => [...items, model]); setFuture((items) => items.slice(1)); setModel(next) }

  const renderTree = (node: VisualNode, depth = 0): React.ReactNode => {
    const children = childrenOf(node)
    const matches = !search || `${labelForNode(node)} ${node.text ?? ''}`.toLowerCase().includes(search.toLowerCase())
    if (!matches && !children.some((child) => JSON.stringify(child).toLowerCase().includes(search.toLowerCase()))) return null
    return <div key={node.uid}><button onClick={() => setSelectedId(node.uid)} className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors ${selectedId === node.uid ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} style={{ paddingLeft: `${8 + depth * 14}px` }}>{children.length ? <ChevronRight className="size-3" /> : <span className="size-3" />}<span className="truncate">{labelForNode(node)}</span></button>{children.map((child) => renderTree(child, depth + 1))}</div>
  }

  const renderPreview = (node: VisualNode, depth = 0): React.ReactNode => {
    const allowed = new Set(['main','div','section','header','footer','nav','article','aside','h1','h2','h3','h4','h5','h6','p','span','strong','em','small','ul','ol','li','a','button','img','video','form','label','input','textarea','blockquote'])
    const tag = allowed.has(node.tag.toLowerCase()) ? node.tag.toLowerCase() : 'div'
    const sourceStyles = node.styles ?? {}
    const styleMap: Record<string, string> = {
      display: 'display', position: 'position', width: 'width', height: 'height',
      margin: 'margin', marginTop: 'marginTop', marginBottom: 'marginBottom',
      padding: 'padding', paddingTop: 'paddingTop', paddingBottom: 'paddingBottom',
      gap: 'gap', color: 'color', backgroundColor: 'backgroundColor',
      fontFamily: 'fontFamily', fontSize: 'fontSize', fontWeight: 'fontWeight',
      lineHeight: 'lineHeight', textAlign: 'textAlign', border: 'border',
      borderRadius: 'borderRadius', boxShadow: 'boxShadow', opacity: 'opacity',
      flexDirection: 'flexDirection', alignItems: 'alignItems', justifyContent: 'justifyContent',
      gridTemplateColumns: 'gridTemplateColumns', overflow: 'overflow'
    }
    const style: Record<string, string> = {}
    for (const [sourceKey, targetKey] of Object.entries(styleMap)) {
      const value = sourceStyles[sourceKey] ?? sourceStyles[targetKey]
      if (typeof value === 'string' && value.length < 160) style[targetKey] = value
    }
    const attrs = node.attributes ?? {}
    const className = `rounded-sm transition-shadow ${selectedId === node.uid ? 'outline outline-2 outline-blue-500 outline-offset-2' : 'hover:outline hover:outline-1 hover:outline-blue-300'}`
    const children = childrenOf(node).map((child) => renderPreview(child, depth + 1))
    const text = children.length ? null : node.text
    const onClick = (event: React.MouseEvent) => { event.preventDefault(); event.stopPropagation(); setSelectedId(node.uid) }
    if (tag === 'img') {
      const src = attrs.src || attrs['data-src'] || attrs['srcset']?.split(',')[0]?.trim().split(' ')[0]
      return <img key={node.uid} src={src} alt={attrs.alt || ''} onClick={onClick} className={className} style={{ ...style, maxWidth: '100%', objectFit: 'contain' }} />
    }
    if (tag === 'input') return <input key={node.uid} readOnly value={attrs.value || ''} placeholder={attrs.placeholder || ''} onClick={onClick} className={className} style={style} />
    if (tag === 'textarea') return <textarea key={node.uid} readOnly value={text || attrs.value || ''} onClick={onClick} className={className} style={style} />
    if (tag === 'a') return <a key={node.uid} href="#" onClick={onClick} className={className} style={style}>{text}{children}</a>
    if (tag === 'button') return <button key={node.uid} type="button" onClick={onClick} className={className} style={style}>{text}{children}</button>
    if (tag === 'video') return <div key={node.uid} onClick={onClick} className={className} style={{ ...style, minHeight: 100, background: '#171717', color: '#d4d4d4', display: 'grid', placeItems: 'center' }}>Vídeo</div>
    return React.createElement(tag, { key: node.uid, onClick, className, style }, text, ...children)
  }

  if (status === 'loading') return <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">A carregar o editor…</main>
  if (status === 'error' && !model) return <main className="flex min-h-screen items-center justify-center bg-background p-6 text-center"><div><AlertCircle className="mx-auto mb-3 size-6 text-destructive" /><p className="font-medium">Não foi possível abrir o editor</p><p className="mt-2 text-sm text-muted-foreground">{error}</p></div></main>

  return <main className="min-h-screen bg-muted/20 text-foreground">
    <header className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
      <Button variant="ghost" size="icon" aria-label="Voltar" onClick={() => window.history.back()}><ArrowLeft /></Button>
      <div className="min-w-0"><p className="text-[11px] text-muted-foreground">Editor visual</p><h1 className="truncate text-sm font-semibold">{model?.title || 'Página reconstruída'}</h1></div>
      <Badge variant="outline" className="hidden sm:inline-flex">{status === 'saved' || !dirty ? 'Guardado' : 'Alterações por guardar'}</Badge>
      <div className="ml-auto flex items-center gap-1"><Button variant="ghost" size="icon" aria-label="Desfazer" onClick={undo} disabled={!undoStack.length}><Undo2 /></Button><Button variant="ghost" size="icon" aria-label="Refazer" onClick={redo} disabled={!future.length}><Redo2 /></Button><Button variant="outline" size="sm" className="hidden sm:inline-flex"><Eye data-icon="inline-start" /> Pré-visualizar</Button><Button size="sm" onClick={save} disabled={!dirty || status === 'saving'}><Save data-icon="inline-start" /> {status === 'saving' ? 'A guardar…' : 'Guardar'}</Button></div>
    </header>
    <div className="border-b border-border bg-background px-4 py-2 text-center text-xs text-muted-foreground">Estás a editar o modelo real devolvido pela API. As alterações são guardadas no backend.</div>
    <div className="grid min-h-[calc(100vh-104px)] lg:grid-cols-[240px_minmax(0,1fr)_300px]">
      <aside className="border-b border-border bg-background p-4 lg:border-b-0 lg:border-r"><div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-semibold">Conteúdo</p><p className="mt-1 text-xs text-muted-foreground">Escolhe uma parte da página</p></div><Layers3 className="size-4 text-muted-foreground" /></div><div className="mb-4 flex items-center gap-2 rounded-md border border-border px-2"><Search className="size-3.5 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar conteúdo" className="h-8 min-w-0 flex-1 bg-transparent text-xs outline-none" /></div><div className="max-h-[55vh] overflow-y-auto">{root ? renderTree(root) : <p className="text-xs text-muted-foreground">Este modelo não tem conteúdo editável.</p>}</div></aside>
      <section className="flex min-w-0 flex-col bg-muted/30 p-4 sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-medium text-muted-foreground">Pré-visualização</p><p className="text-sm font-semibold">{selectedNode ? labelForNode(selectedNode) : 'Selecciona uma secção'}</p></div><div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1"><Button variant={viewport === 'desktop' ? 'secondary' : 'ghost'} size="icon-sm" aria-label="Computador" onClick={() => setViewport('desktop')}><Monitor /></Button><Button variant={viewport === 'tablet' ? 'secondary' : 'ghost'} size="icon-sm" aria-label="Tablet" onClick={() => setViewport('tablet')}><Tablet /></Button><Button variant={viewport === 'mobile' ? 'secondary' : 'ghost'} size="icon-sm" aria-label="Telemóvel" onClick={() => setViewport('mobile')}><Smartphone /></Button></div></div><div className="flex flex-1 items-start justify-center overflow-auto rounded-xl border border-border bg-background p-4 shadow-sm sm:p-8"><div className={`min-h-[480px] w-full overflow-auto rounded-lg border border-dashed border-border bg-white p-5 text-black transition-all ${viewport === 'mobile' ? 'max-w-[390px]' : viewport === 'tablet' ? 'max-w-[720px]' : 'max-w-[1080px]'}`}><div className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-3 text-xs text-gray-500"><span className="size-2 rounded-full bg-emerald-500" /> Pré-visualização · {viewport === 'mobile' ? 'Telemóvel' : viewport === 'tablet' ? 'Tablet' : 'Computador'}</div>{root ? renderPreview(root) : <p className="py-24 text-center text-sm text-gray-500">Este modelo não contém uma página para pré-visualizar.</p>}</div></div></section>
      <aside className="border-t border-border bg-background p-4 lg:border-t-0 lg:border-l"><div className="mb-5"><p className="text-sm font-semibold">Editar elemento</p><p className="mt-1 text-xs text-muted-foreground">Opções simples para o conteúdo seleccionado</p></div>{selectedNode ? <div className="flex flex-col gap-5"><div><label htmlFor="element-text" className="text-xs font-medium">Texto</label><textarea id="element-text" value={selectedNode.text ?? ''} onChange={(event) => updateText(event.target.value)} rows={5} className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Escreve o conteúdo…" /></div><Separator /><div><p className="text-xs font-medium">Informação</p><p className="mt-2 text-xs text-muted-foreground">Tipo de conteúdo: {labelForNode(selectedNode)}</p><p className="mt-1 text-xs text-muted-foreground">As opções de aparência avançada dependem do modelo devolvido pela API.</p></div><Card className="border-border bg-muted/30"><CardHeader className="p-4"><CardTitle className="text-xs">Pixels e acompanhamento</CardTitle></CardHeader><CardContent className="p-4 pt-0 text-xs text-muted-foreground">A configuração de pixels requer um endpoint de backend que não existe no contrato actual. Nenhum pixel é apresentado como activo.</CardContent></Card></div> : <div className="rounded-lg border border-dashed border-border p-5 text-center text-xs text-muted-foreground">Selecciona um título, texto, imagem ou botão para editar.</div>}{error && <p className="mt-5 text-xs text-destructive" role="alert">{error}</p>}</aside>
    </div>
  </main>
}
