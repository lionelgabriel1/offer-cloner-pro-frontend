'use client'

import { createElement, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import { AlertCircle, ArrowLeft, ChevronRight, Eye, Monitor, Save, Search, Smartphone, Tablet, Undo2, Redo2, Layers3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { apiClient, isApiConfigured, type EditorDomNode, type PageModel } from '@/lib/api'
import { isSafePreviewCssValue, safePreviewUrl } from '@/lib/preview-safety'

type VisualNode = EditorDomNode & { children?: VisualNode[] }
type Viewport = 'desktop' | 'tablet' | 'mobile'

const labelForNode = (node: VisualNode) => {
  const tag = node.tag.toLowerCase()
  const tagLabels: Record<string, string> = {
    html: 'Documento', body: 'Página', main: 'Conteúdo principal', section: 'Secção',
    header: 'Cabeçalho', footer: 'Rodapé', nav: 'Navegação', article: 'Artigo',
    aside: 'Conteúdo lateral', div: 'Grupo de conteúdo', h1: 'Título principal',
    h2: 'Título', h3: 'Subtítulo', h4: 'Título secundário', h5: 'Título pequeno',
    h6: 'Título pequeno', p: 'Texto', span: 'Texto em linha', img: 'Imagem',
    picture: 'Imagem responsiva', video: 'Vídeo', iframe: 'Conteúdo incorporado',
    button: 'Botão', a: 'Ligação', form: 'Formulário', input: 'Campo de entrada',
    textarea: 'Campo de texto', select: 'Lista de opções', option: 'Opção',
    label: 'Rótulo', fieldset: 'Grupo de campos', legend: 'Título do formulário',
    ul: 'Lista', ol: 'Lista numerada', li: 'Item da lista', blockquote: 'Citação',
    strong: 'Texto em destaque', em: 'Texto enfatizado', small: 'Texto pequeno',
    details: 'Secção expansível', summary: 'Título expansível', table: 'Tabela',
    tr: 'Linha da tabela', td: 'Célula', th: 'Cabeçalho da tabela'
  }
  const text = node.text?.replace(/\s+/g, ' ').trim()
  const hints = [node.id ?? '', ...(node.classes ?? []), ...Object.values(node.attributes ?? {}).filter((value) => typeof value === 'string').slice(0, 12)].join(' ').toLowerCase()
  const semanticLabels: Array<[RegExp, string]> = [
    [/testimonial|depoimento|review|feedback/, 'Depoimento'],
    [/\bfaq\b|frequently-asked|perguntas-frequentes/, 'Perguntas frequentes'],
    [/quiz|question|pergunta/, 'Pergunta do quiz'],
    [/answer|resposta|option/, 'Opção de resposta'],
    [/pricing|price|preco|preço|plan-card/, 'Preço ou plano'],
    [/countdown|timer|contagem/, 'Contador'],
    [/progress|progresso/, 'Barra de progresso'],
    [/hero|banner/, 'Secção principal'],
    [/cta|call-to-action/, 'Chamada para acção']
  ]
  const semantic = semanticLabels.find(([pattern]) => pattern.test(hints))?.[1]
  const label = semantic ?? tagLabels[tag] ?? 'Elemento personalizado'
  return text ? `${label} — ${text.slice(0, 46)}${text.length > 46 ? '…' : ''}` : label
}

const childrenOf = (node: VisualNode) => Array.isArray(node.children) ? node.children : []

export default function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const [model, setModel] = useState<PageModel | null>(null)
  const [savedModel, setSavedModel] = useState<PageModel | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [previewOnly, setPreviewOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [collapsedIds, setCollapsedIds] = useState<string[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'saved' | 'error'>('loading')
  const [error, setError] = useState('')
  const [undoStack, setUndoStack] = useState<PageModel[]>([])
  const [future, setFuture] = useState<PageModel[]>([])

  useEffect(() => {
    let active = true
    if (!isApiConfigured) { setError('A API não está configurada. Não é possível abrir um modelo real.'); setStatus('error'); return () => { active = false } }
    apiClient.getProjectEditor(id).then((response) => {
      if (!active) return
      setModel(response.model); setSavedModel(response.model); setSelectedId((response.model.viewports.find((item) => item.kind === 'desktop')?.dom as VisualNode | undefined)?.uid ?? ''); setStatus('ready')
    }).catch((cause: unknown) => { if (active) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o modelo.'); setStatus('error') } })
    return () => { active = false }
  }, [id])

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

  useEffect(() => {
    if (!dirty) return
    const warnBeforeLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeLeave)
    return () => window.removeEventListener('beforeunload', warnBeforeLeave)
  }, [dirty])

  const updateSelectedNode = (mutate: (node: VisualNode) => void) => {
    if (!model || !selectedNode || status === 'saving') return
    setUndoStack((items) => [...items.slice(-19), model])
    setFuture([])
    const next = structuredClone(model) as PageModel
    const target = next.viewports.find((item) => item.kind === viewport)?.dom as VisualNode | undefined
    const update = (node: VisualNode): boolean => {
      if (node.uid === selectedNode.uid) { mutate(node); return true }
      return childrenOf(node).some(update)
    }
    if (target) update(target)
    setModel(next)
    setStatus('ready')
  }

  const updateText = (value: string) => updateSelectedNode((node) => { node.text = value })
  const updateAttribute = (key: string, value: string) => updateSelectedNode((node) => {
    node.attributes = { ...(node.attributes ?? {}), [key]: value }
  })
  const updateStyle = (key: string, value: string) => {
    // Keep inline CSS values simple and predictable; styles are data from a captured external page.
    if (!isSafePreviewCssValue(value)) return
    updateSelectedNode((node) => {
      node.styles = { ...(node.styles ?? {}), [key]: value }
    })
  }

  const toggleCollapsed = (uid: string) => setCollapsedIds((items) =>
    items.includes(uid) ? items.filter((item) => item !== uid) : [...items, uid]
  )

  const save = async () => {
    if (!model || !dirty) return
    setStatus('saving'); setError('')
    try { const response = await apiClient.updateProjectEditor(id, model); setModel(response.model); setSavedModel(response.model); setStatus('saved') } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : 'Não foi possível guardar as alterações.'); setStatus('error') }
  }
  const undo = () => { const previous = undoStack.at(-1); if (!previous || !model || status === 'saving') return; setFuture((items) => [model, ...items]); setUndoStack((items) => items.slice(0, -1)); setModel(previous) }
  const redo = () => { const next = future[0]; if (!next || !model || status === 'saving') return; setUndoStack((items) => [...items, model]); setFuture((items) => items.slice(1)); setModel(next) }

  const renderTree = (node: VisualNode, depth = 0): ReactNode => {
    const children = childrenOf(node)
    const matches = !search || `${labelForNode(node)} ${node.text ?? ''}`.toLowerCase().includes(search.toLowerCase())
    const descendantMatches = (candidate: VisualNode): boolean =>
      `${labelForNode(candidate)} ${candidate.text ?? ''}`.toLowerCase().includes(search.toLowerCase()) ||
      childrenOf(candidate).some(descendantMatches)
    if (!matches && !children.some(descendantMatches)) return null
    const expanded = search.length > 0 || !collapsedIds.includes(node.uid)
    return <div key={node.uid}>
      <div className="flex items-center gap-1" style={{ paddingLeft: `${depth * 14}px` }}>
        {children.length > 0 ? <button type="button" aria-label={expanded ? 'Recolher elementos' : 'Expandir elementos'} aria-expanded={expanded} onClick={() => toggleCollapsed(node.uid)} className="flex size-6 shrink-0 items-center justify-center rounded hover:bg-muted"><ChevronRight className={`size-3 transition-transform ${expanded ? 'rotate-90' : ''}`} /></button> : <span className="size-6 shrink-0" />}
        <button type="button" onClick={() => setSelectedId(node.uid)} aria-current={selectedId === node.uid ? 'true' : undefined} className={`flex min-w-0 flex-1 items-center rounded-md px-2 py-2 text-left text-xs transition-colors ${selectedId === node.uid ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><span className="truncate">{labelForNode(node)}</span></button>
      </div>
      {expanded && children.map((child) => renderTree(child, depth + 1))}
    </div>
  }

  const renderPreview = (node: VisualNode, depth = 0): ReactNode => {
    const allowed = new Set(['main','div','section','header','footer','nav','article','aside','h1','h2','h3','h4','h5','h6','p','span','strong','em','small','ul','ol','li','a','button','img','video','form','label','input','textarea','blockquote'])
    const originalTag = node.tag.toLowerCase()
    // Render captured forms as inert containers so Enter/click cannot submit anything.
    const tag = originalTag === 'form' ? 'div' : allowed.has(originalTag) ? originalTag : 'div'
    const sourceStyles = node.styles ?? {}
    const styleMap: Record<string, string> = {
      display: 'display', position: 'position', width: 'width', height: 'height',
      minWidth: 'minWidth', maxWidth: 'maxWidth', minHeight: 'minHeight', maxHeight: 'maxHeight',
      margin: 'margin', marginTop: 'marginTop', marginRight: 'marginRight', marginBottom: 'marginBottom', marginLeft: 'marginLeft',
      padding: 'padding', paddingTop: 'paddingTop', paddingRight: 'paddingRight', paddingBottom: 'paddingBottom', paddingLeft: 'paddingLeft',
      gap: 'gap', color: 'color', background: 'background', backgroundColor: 'backgroundColor',
      backgroundImage: 'backgroundImage', backgroundSize: 'backgroundSize', backgroundPosition: 'backgroundPosition',
      fontFamily: 'fontFamily', fontSize: 'fontSize', fontWeight: 'fontWeight',
      lineHeight: 'lineHeight', textAlign: 'textAlign', border: 'border',
      borderRadius: 'borderRadius', boxShadow: 'boxShadow', opacity: 'opacity',
      flexDirection: 'flexDirection', alignItems: 'alignItems', justifyContent: 'justifyContent',
      gridTemplateColumns: 'gridTemplateColumns', overflow: 'overflow', fontStyle: 'fontStyle',
      textDecoration: 'textDecoration', borderColor: 'borderColor', borderWidth: 'borderWidth',
      objectFit: 'objectFit', flexWrap: 'flexWrap', whiteSpace: 'whiteSpace', letterSpacing: 'letterSpacing'
    }
    const style: CSSProperties = {}
    for (const [sourceKey, targetKey] of Object.entries(styleMap)) {
      const kebabKey = sourceKey.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
      const value = sourceStyles[sourceKey] ?? sourceStyles[targetKey] ?? sourceStyles[kebabKey]
      if (isSafePreviewCssValue(value)) (style as Record<string, string>)[targetKey] = value
    }
    const attrs = node.attributes ?? {}
    const className = previewOnly ? '' : selectedId === node.uid ? 'outline outline-2 outline-blue-500 outline-offset-2' : 'hover:outline hover:outline-1 hover:outline-blue-300'
    const children = childrenOf(node).map((child) => renderPreview(child, depth + 1))
    const text = children.length ? null : node.text
    const onClick = (event: MouseEvent<HTMLElement>) => { event.preventDefault(); event.stopPropagation(); if (!previewOnly) setSelectedId(node.uid) }
    if (tag === 'img') {
      const rawSrc = attrs.src || attrs['data-src'] || attrs['data-lazy-src'] || attrs['srcset']?.split(',')[0]?.trim().split(' ')[0]
      const src = safePreviewUrl(rawSrc)
      if (!src) return <div key={node.uid} onClick={onClick} className={className} style={{ ...style, minHeight: 40 }}>Imagem indisponível no preview</div>
      return <img key={node.uid} src={src} alt={attrs.alt || ''} referrerPolicy="no-referrer" onClick={onClick} className={className} style={{ ...style, maxWidth: style.maxWidth ?? '100%', objectFit: style.objectFit ?? 'contain' }} />
    }
    if (tag === 'input') return <input key={node.uid} readOnly value={attrs.value || ''} placeholder={attrs.placeholder || ''} type={attrs.type || 'text'} onClick={onClick} className={className} style={style} />
    if (tag === 'textarea') return <textarea key={node.uid} readOnly value={text || attrs.value || ''} placeholder={attrs.placeholder || ''} onClick={onClick} className={className} style={style} />
    if (tag === 'a') return <a key={node.uid} href={safePreviewUrl(attrs.href) ?? '#'} rel="noreferrer" onClick={onClick} className={className} style={style}>{text}{children}</a>
    if (tag === 'button') return <button key={node.uid} type="button" onClick={onClick} className={className} style={style}>{text}{children}</button>
    if (tag === 'video') {
      const src = safePreviewUrl(attrs.src || attrs['data-src'])
      if (src) {
        return <video key={node.uid} src={src} controls ref={element => { if (element) element.setAttribute('referrerpolicy', 'no-referrer') }} onClick={onClick} className={className} style={{ ...style, maxWidth: '100%' }}>O teu navegador não suporta este vídeo.</video>
      }
      return <div key={node.uid} onClick={onClick} className={className} style={{ ...style, minHeight: 100, background: '#171717', color: '#d4d4d4', display: 'grid', placeItems: 'center' }}>Vídeo não disponível na captura</div>
    }
    const safeAttributes: Record<string, string> = {}
    const allowedAttributes = ['title', 'role', 'aria-label', 'alt', 'name', 'type', 'value', 'placeholder', 'width', 'height', 'colspan', 'rowspan', 'dir', 'lang']
    for (const key of allowedAttributes) {
      const value = attrs[key]
      if (typeof value === 'string' && value.length <= 500) safeAttributes[key === 'colspan' ? 'colSpan' : key === 'rowspan' ? 'rowSpan' : key] = value
    }
    return createElement(tag, { ...safeAttributes, key: node.uid, onClick, className, style }, text, ...children)
  }

  if (status === 'loading') return <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">A carregar o editor…</main>
  if (status === 'error' && !model) return <main className="flex min-h-screen items-center justify-center bg-background p-6 text-center"><div><AlertCircle className="mx-auto mb-3 size-6 text-destructive" /><p className="font-medium">Não foi possível abrir o editor</p><p className="mt-2 text-sm text-muted-foreground">{error}</p></div></main>

  return <main className="min-h-screen bg-muted/20 text-foreground">
    <header className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
      <Button variant="ghost" size="icon" aria-label="Voltar" onClick={() => window.history.back()}><ArrowLeft /></Button>
      <div className="min-w-0"><p className="text-[11px] text-muted-foreground">Editor visual</p><h1 className="truncate text-sm font-semibold">{model?.title || 'Página reconstruída'}</h1></div>
      <Badge variant="outline" className="hidden sm:inline-flex">{status === 'saved' || !dirty ? 'Guardado' : 'Alterações por guardar'}</Badge>
      <div className="ml-auto flex items-center gap-1"><Button variant="ghost" size="icon" aria-label="Desfazer" onClick={undo} disabled={!undoStack.length || status === 'saving'}><Undo2 /></Button><Button variant="ghost" size="icon" aria-label="Refazer" onClick={redo} disabled={!future.length || status === 'saving'}><Redo2 /></Button><Button variant="outline" size="sm" onClick={() => setPreviewOnly((value) => !value)}><Eye data-icon="inline-start" /> {previewOnly ? "Voltar ao editor" : "Pré-visualizar"}</Button><Button size="sm" onClick={save} disabled={!dirty || status === 'saving'}><Save data-icon="inline-start" /> {status === 'saving' ? 'A guardar…' : 'Guardar'}</Button></div>
    </header>
    <div className="border-b border-border bg-background px-4 py-2 text-center text-xs text-muted-foreground">Estás a editar o modelo real devolvido pela API. As alterações são guardadas no backend.</div>
    <div className={previewOnly ? "grid min-h-[calc(100vh-104px)] grid-cols-1" : "grid min-h-[calc(100vh-104px)] lg:grid-cols-[240px_minmax(0,1fr)_300px]"}>
      {!previewOnly && <aside className="border-b border-border bg-background p-4 lg:border-b-0 lg:border-r"><div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-semibold">Conteúdo</p><p className="mt-1 text-xs text-muted-foreground">Escolhe uma parte da página</p></div><Layers3 className="size-4 text-muted-foreground" /></div><div className="mb-4 flex items-center gap-2 rounded-md border border-border px-2"><Search className="size-3.5 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar conteúdo" className="h-8 min-w-0 flex-1 bg-transparent text-xs outline-none" /></div><div className="max-h-[55vh] overflow-y-auto">{root ? renderTree(root) : <p className="text-xs text-muted-foreground">Este modelo não tem conteúdo editável.</p>}</div></aside>}
      <section className={previewOnly ? "flex min-w-0 flex-col bg-muted/30 p-4 sm:p-6" : "flex min-w-0 flex-col bg-muted/30 p-4 sm:p-6"}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-medium text-muted-foreground">Pré-visualização</p><p className="text-sm font-semibold">{selectedNode ? labelForNode(selectedNode) : 'Selecciona uma secção'}</p></div><div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1"><Button variant={viewport === 'desktop' ? 'secondary' : 'ghost'} size="icon-sm" aria-label="Computador" onClick={() => { setViewport('desktop'); const nextRoot = model?.viewports.find((item) => item.kind === 'desktop')?.dom as VisualNode | undefined; if (nextRoot) setSelectedId(nextRoot.uid) }}><Monitor /></Button><Button variant={viewport === 'tablet' ? 'secondary' : 'ghost'} size="icon-sm" aria-label="Tablet" onClick={() => { setViewport('tablet'); const nextRoot = model?.viewports.find((item) => item.kind === 'tablet')?.dom as VisualNode | undefined; if (nextRoot) setSelectedId(nextRoot.uid) }}><Tablet /></Button><Button variant={viewport === 'mobile' ? 'secondary' : 'ghost'} size="icon-sm" aria-label="Telemóvel" onClick={() => { setViewport('mobile'); const nextRoot = model?.viewports.find((item) => item.kind === 'mobile')?.dom as VisualNode | undefined; if (nextRoot) setSelectedId(nextRoot.uid) }}><Smartphone /></Button></div></div><div className="flex flex-1 items-start justify-center overflow-auto rounded-xl border border-border bg-background p-4 shadow-sm sm:p-8"><div className={`min-h-[480px] w-full overflow-auto rounded-lg border border-dashed border-border bg-white p-5 text-black transition-all ${viewport === 'mobile' ? 'max-w-[390px]' : viewport === 'tablet' ? 'max-w-[720px]' : 'max-w-[1080px]'}`}><div className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-3 text-xs text-gray-500"><span className="size-2 rounded-full bg-emerald-500" /> Pré-visualização · {viewport === 'mobile' ? 'Telemóvel' : viewport === 'tablet' ? 'Tablet' : 'Computador'}</div>{root ? renderPreview(root) : <p className="py-24 text-center text-sm text-gray-500">Este modelo não contém uma página para pré-visualizar.</p>}</div></div></section>
      {!previewOnly && <aside className="border-t border-border bg-background p-4 lg:border-t-0 lg:border-l"><div className="mb-5"><p className="text-sm font-semibold">Editar elemento</p><p className="mt-1 text-xs text-muted-foreground">Opções simples para o conteúdo seleccionado</p></div>{selectedNode ? <div className="flex flex-col gap-5"><div><label htmlFor="element-text" className="text-xs font-medium">{['img', 'video'].includes(selectedNode.tag.toLowerCase()) ? 'Descrição ou texto' : 'Texto do elemento'}</label><textarea id="element-text" value={selectedNode.text ?? ''} onChange={(event) => updateText(event.target.value)} rows={4} className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Escreve o conteúdo…" /></div>{['img', 'video', 'source'].includes(selectedNode.tag.toLowerCase()) && <div><label htmlFor="element-src" className="text-xs font-medium">URL do ficheiro</label><input id="element-src" value={selectedNode.attributes?.src ?? selectedNode.attributes?.['data-src'] ?? ''} onChange={(event) => updateAttribute('src', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="https://…" /></div>}{selectedNode.tag.toLowerCase() === 'img' && <div><label htmlFor="element-alt" className="text-xs font-medium">Texto alternativo</label><input id="element-alt" value={selectedNode.attributes?.alt ?? ''} onChange={(event) => updateAttribute('alt', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Descrição acessível da imagem" /></div>}{selectedNode.tag.toLowerCase() === 'a' && <div><label htmlFor="element-href" className="text-xs font-medium">Destino da ligação</label><input id="element-href" value={selectedNode.attributes?.href ?? ''} onChange={(event) => updateAttribute('href', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="https://…" /></div>}{['input', 'textarea'].includes(selectedNode.tag.toLowerCase()) && <div className="space-y-3"><div><label htmlFor="element-placeholder" className="text-xs font-medium">Texto de exemplo do campo</label><input id="element-placeholder" value={selectedNode.attributes?.placeholder ?? ''} onChange={(event) => updateAttribute('placeholder', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Introduz um exemplo…" /></div>{selectedNode.tag.toLowerCase() === 'input' && <div><label htmlFor="element-value" className="text-xs font-medium">Valor inicial</label><input id="element-value" value={selectedNode.attributes?.value ?? ''} onChange={(event) => updateAttribute('value', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Valor inicial do campo" /></div>}</div>}<Separator /><div className="space-y-3"><div><p className="text-xs font-semibold">Aparência</p><p className="mt-1 text-xs text-muted-foreground">Altera os estilos capturados deste elemento.</p></div><div><label htmlFor="element-color" className="text-xs font-medium">Cor do texto (CSS)</label><input id="element-color" value={selectedNode.styles?.color ?? ''} onChange={(event) => updateStyle('color', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="#222222 ou white" /></div><div><label htmlFor="element-background" className="text-xs font-medium">Cor de fundo (CSS)</label><input id="element-background" value={selectedNode.styles?.backgroundColor ?? selectedNode.styles?.['background-color'] ?? ''} onChange={(event) => updateStyle('backgroundColor', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="transparent ou #ffffff" /></div><div><label htmlFor="element-font-size" className="text-xs font-medium">Tamanho do texto (CSS)</label><input id="element-font-size" value={selectedNode.styles?.fontSize ?? selectedNode.styles?.['font-size'] ?? ''} onChange={(event) => updateStyle('fontSize', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="16px ou 1rem" /></div><div><label htmlFor="element-font-weight" className="text-xs font-medium">Peso do texto (CSS)</label><input id="element-font-weight" value={selectedNode.styles?.fontWeight ?? selectedNode.styles?.['font-weight'] ?? ''} onChange={(event) => updateStyle('fontWeight', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="400, 600 ou bold" /></div><div><label htmlFor="element-text-align" className="text-xs font-medium">Alinhamento</label><select id="element-text-align" value={selectedNode.styles?.textAlign ?? selectedNode.styles?.['text-align'] ?? ''} onChange={(event) => updateStyle('textAlign', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"><option value="">Original</option><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option><option value="justify">Justificado</option></select></div><div><label htmlFor="element-radius" className="text-xs font-medium">Arredondamento (CSS)</label><input id="element-radius" value={selectedNode.styles?.borderRadius ?? selectedNode.styles?.['border-radius'] ?? ''} onChange={(event) => updateStyle('borderRadius', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="8px ou 1rem" /></div><div><label htmlFor="element-padding" className="text-xs font-medium">Espaçamento interno (CSS)</label><input id="element-padding" value={selectedNode.styles?.padding ?? ''} onChange={(event) => updateStyle('padding', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="16px ou 1rem" /></div><div><label htmlFor="element-width" className="text-xs font-medium">Largura (CSS)</label><input id="element-width" value={selectedNode.styles?.width ?? ''} onChange={(event) => updateStyle('width', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="100%, 320px ou auto" /></div><div><label htmlFor="element-height" className="text-xs font-medium">Altura (CSS)</label><input id="element-height" value={selectedNode.styles?.height ?? ''} onChange={(event) => updateStyle('height', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="auto ou 240px" /></div><div><label htmlFor="element-border" className="text-xs font-medium">Borda (CSS)</label><input id="element-border" value={selectedNode.styles?.border ?? ''} onChange={(event) => updateStyle('border', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="1px solid #dddddd" /></div><div><label htmlFor="element-shadow" className="text-xs font-medium">Sombra (CSS)</label><input id="element-shadow" value={selectedNode.styles?.boxShadow ?? selectedNode.styles?.['box-shadow'] ?? ''} onChange={(event) => updateStyle('boxShadow', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="0 2px 8px #00000020" /></div></div><Separator /><div><p className="text-xs font-medium">Tipo de elemento</p><p className="mt-2 text-sm">{labelForNode(selectedNode)}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">As propriedades apresentadas dependem do conteúdo capturado. A pré-visualização não executa formulários nem envia dados.</p></div><Card className="border-border bg-muted/30"><CardHeader className="p-4"><CardTitle className="text-xs">Pixels e acompanhamento</CardTitle></CardHeader><CardContent className="p-4 pt-0 text-xs text-muted-foreground">A configuração de pixels requer um endpoint de backend que não existe no contrato actual. Nenhum pixel é apresentado como activo.</CardContent></Card></div> : <div className="rounded-lg border border-dashed border-border p-5 text-center text-xs text-muted-foreground">Selecciona um título, texto, imagem ou botão para editar.</div>}{error && <p className="mt-5 text-xs text-destructive" role="alert">{error}</p>}</aside>}
    </div>
  </main>
}
