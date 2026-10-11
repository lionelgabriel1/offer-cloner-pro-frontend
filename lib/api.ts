export type CrawlStatus = 'queued' | 'running' | 'paused' | 'cancelled' | 'completed' | 'partial' | 'failed'
export type CrawlPageStatus = 'pending' | 'in_progress' | 'analyzed' | 'ignored' | 'failed'

export type Progress = {
  percentage: number
  pages: { discovered: number; analyzed: number; pending: number; ignored: number; failed: number }
  interactions: { states: number; branches: number; pending: number }
  assets: { found: number; downloaded: number; failed: number }
  limitsApplied: string[]
}
export type CrawlJobStatus = {
  jobId: string
  siteId: string
  seedUrl: string
  status: CrawlStatus
  progress: Progress | null
  options: Record<string, unknown>
  createdAt: string
  updatedAt: string
  finishedAt?: string
}
export type CrawlJobLinkSet = { self: string; pages: string; report: string; siteModel: string }
export type CreateCrawlJobResponse = {
  jobId: string
  siteId: string
  status: CrawlStatus
  progress: Progress | null
  links: CrawlJobLinkSet
}
export type CrawlActionResponse = { jobId: string; status: string; progress?: Progress | null; message?: string }
export type HealthResponse = { ok: boolean }

export type SitePage = {
  pageKey: string
  requestedUrl: string
  canonicalUrl: string
  finalUrl?: string
  depth: number
  status: CrawlPageStatus
  discoveredFrom?: string
  httpStatus?: number
  redirects: string[]
  pageModelPath?: string
  title?: string
  screenshotPaths: string[]
  stateIds: string[]
  linksFound: number
  assetsFound: number
  assetsDownloaded: number
  assetsFailed: number
  error?: string
  limitations: string[]
}
export type CrawlPageListResponse = {
  jobId: string
  status: CrawlStatus
  progress: Progress | null
  pagination: { offset: number; limit: number; total: number; hasMore: boolean }
  pages: SitePage[]
}
export type CrawlReport = {
  jobId: string
  status: CrawlStatus
  progress: Progress | null
  links: unknown[]
  interactions: unknown[]
  limitations: string[]
  errors: string[]
  generatedAt: string
}

export type EditorDomNode = {
  uid: string
  tag: string
  id?: string
  classes?: string[]
  attributes?: Record<string, string>
  text?: string
  children?: EditorDomNode[]
  visible?: boolean
  styles?: Record<string, string>
  [key: string]: unknown
}
export type EditorViewport = {
  kind: 'desktop' | 'tablet' | 'mobile'
  width: number
  height: number
  dom: EditorDomNode
  screenshotPath?: string
  htmlPath?: string
  scrollHeight?: number
  [key: string]: unknown
}
export type PageModel = {
  schemaVersion: '1.0'
  projectId: string
  sourceUrl: string
  capturedAt: string
  title: string
  viewports: EditorViewport[]
  assets: Array<Record<string, unknown>>
  metadata: { userAgent: string; durationMs: number; warnings: string[] }
  navigation?: Record<string, unknown>
  [key: string]: unknown
}
export type ProjectEditorResponse = { project: { id: string; sourceUrl: string; status: string }; model: PageModel }
export type UpdateProjectModelResponse = { ok: true; status: 'edited'; model: PageModel }
export type ProjectResponse = { id: string; sourceUrl: string; status: string; createdAt: string; updatedAt: string; pageModel?: PageModel | null }

type ResponseMode = 'json' | 'text' | 'blob'

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export type ApiClient = ReturnType<typeof createApiClient>

export function createApiClient(configuredBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.VITE_API_BASE_URL) {
  const baseUrl = configuredBase?.replace(/\/+$/, '')
  const configured = Boolean(baseUrl)

  async function request<T>(
    path: string,
    token?: string,
    init?: RequestInit,
    responseMode: ResponseMode = 'json',
    authenticate = true,
  ): Promise<T> {
    if (!baseUrl) throw new Error('API não configurada: define NEXT_PUBLIC_API_BASE_URL no ambiente da aplicação.')
    let accessToken = token
    if (authenticate && !accessToken && typeof window !== 'undefined') {
      const { getAccessToken } = await import('@/lib/supabase/client')
      accessToken = (await getAccessToken()) ?? undefined
    }

    const headers = new Headers(init?.headers)
    if (!headers.has('Accept')) headers.set('Accept', responseMode === 'blob' ? '*/*' : responseMode === 'text' ? 'text/markdown' : 'application/json')
    if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    if (accessToken && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${accessToken}`)

    let response: Response
    try {
      response = await fetch(`${baseUrl}${path}`, { ...init, headers })
    } catch {
      throw new ApiError(0, 'Não foi possível contactar a API.')
    }
    if (!response.ok) {
      const messages: Record<number, string> = {
        400: 'Os dados enviados não são válidos.',
        401: 'Sessão ausente ou expirada.',
        403: 'Não tens acesso a este recurso ou origem.',
        404: 'Recurso não encontrado.',
        409: 'O recurso está num estado incompatível com esta operação.',
        413: 'O ficheiro excede o limite permitido.',
        422: 'A operação foi rejeitada. Verifica o URL e as opções.',
        503: 'Serviço temporariamente indisponível.',
      }
      throw new ApiError(response.status, messages[response.status] ?? 'Ocorreu um erro ao comunicar com a API.')
    }
    if (response.status === 204) return undefined as T
    if (responseMode === 'blob') return await response.blob() as T
    if (responseMode === 'text') return await response.text() as T
    const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
    if (contentType.includes('application/json') || contentType.includes('+json')) return await response.json() as T
    if (contentType.startsWith('text/')) return await response.text() as T
    if (!contentType || contentType.includes('octet-stream') || contentType.startsWith('image/')) return await response.blob() as T
    return await response.json() as T
  }

  return {
    configured,
    getHealth: () => request<HealthResponse>('/health', undefined, undefined, 'json', false),
    createProject: (url: string, token?: string) => request<ProjectResponse>('/api/projects', token, { method: 'POST', body: JSON.stringify({ url }) }),
    captureProject: (id: string, token?: string) => request<{ id: string; status: string; pageModel: PageModel; error?: string }>(`/api/projects/${encodeURIComponent(id)}/capture`, token, { method: 'POST' }),
    createCrawlJob: (url: string, options: Record<string, unknown> = {}, token?: string) => request<CreateCrawlJobResponse>('/api/crawl-jobs', token, { method: 'POST', body: JSON.stringify({ url, options }) }),
    getCrawlJob: (id: string, token?: string) => request<CrawlJobStatus>(`/api/crawl-jobs/${encodeURIComponent(id)}`, token),
    resumeCrawlJob: (id: string, options: Record<string, unknown> = {}, token?: string) => request<CrawlActionResponse>(`/api/crawl-jobs/${encodeURIComponent(id)}/resume`, token, { method: 'POST', body: JSON.stringify(options) }),
    cancelCrawlJob: (id: string, token?: string) => request<CrawlActionResponse>(`/api/crawl-jobs/${encodeURIComponent(id)}/cancel`, token, { method: 'POST', body: JSON.stringify({}) }),
    listPages: (id: string, params: { offset?: number; limit?: number; status?: CrawlPageStatus } = {}, token?: string) => {
      const query = new URLSearchParams()
      if (params.offset !== undefined) query.set('offset', String(params.offset))
      if (params.limit !== undefined) query.set('limit', String(params.limit))
      if (params.status) query.set('status', params.status)
      return request<CrawlPageListResponse>(`/api/crawl-jobs/${encodeURIComponent(id)}/pages?${query}`, token)
    },
    getSiteModel: (id: string, token?: string) => request<Record<string, unknown>>(`/api/crawl-jobs/${encodeURIComponent(id)}/site-model`, token),
    getPageModel: (id: string, pageKey: string, token?: string) => request<Record<string, unknown>>(`/api/crawl-jobs/${encodeURIComponent(id)}/pages/${encodeURIComponent(pageKey)}/page-model`, token),
    getReport: (id: string, format: 'json' | 'markdown' = 'json', token?: string) => format === 'markdown'
      ? request<string>(`/api/crawl-jobs/${encodeURIComponent(id)}/report?format=markdown`, token, undefined, 'text')
      : request<CrawlReport>(`/api/crawl-jobs/${encodeURIComponent(id)}/report?format=json`, token),
    getArtifacts: (id: string, logicalPath: string, token?: string) => request<Blob>(`/api/crawl-jobs/${encodeURIComponent(id)}/artifacts?path=${encodeURIComponent(logicalPath)}`, token, undefined, 'blob'),
    getProjectEditor: (id: string, token?: string) => request<ProjectEditorResponse>(`/api/projects/${encodeURIComponent(id)}/editor`, token),
    updateProjectEditor: (id: string, model: PageModel, token?: string) => request<UpdateProjectModelResponse>(`/api/projects/${encodeURIComponent(id)}/editor/model`, token, { method: 'PUT', body: JSON.stringify({ model }) }),
  }
}

export const apiClient = createApiClient()
export const isApiConfigured = apiClient.configured
