export type CrawlStatus = 'queued' | 'running' | 'paused' | 'cancelled' | 'completed' | 'partial' | 'failed'
export type CrawlPageStatus = 'pending' | 'in_progress' | 'analyzed' | 'ignored' | 'failed'

export type Progress = { percentage: number; pages: { discovered: number; analyzed: number; pending: number; ignored: number; failed: number }; interactions: { states: number; branches: number; pending: number }; assets: { found: number; downloaded: number; failed: number }; limitsApplied: string[] }
export type CrawlJobStatus = { jobId: string; siteId: string; seedUrl: string; status: CrawlStatus; progress: Progress | null; options: Record<string, unknown>; createdAt: string; updatedAt: string; finishedAt?: string }
export type HealthResponse = { ok: true }
export type CreateCrawlJobResponse = { jobId: string; siteId: string; status: 'queued'; progress: Progress; links: { self: string; pages: string; report: string; siteModel: string } }
export type SitePage = { pageKey: string; requestedUrl: string; canonicalUrl: string; finalUrl?: string; depth: number; status: CrawlPageStatus; discoveredFrom?: string; httpStatus?: number; redirects: string[]; pageModelPath?: string; title?: string; screenshotPaths: string[]; stateIds: string[]; linksFound: number; assetsFound: number; assetsDownloaded: number; assetsFailed: number; error?: string; limitations: string[] }
export type CrawlPageListResponse = { jobId: string; status: CrawlStatus; progress: Progress | null; pagination: { offset: number; limit: number; total: number; hasMore: boolean }; pages: SitePage[] }
export type CrawlReport = { jobId: string; status: CrawlStatus; progress: Progress | null; links: unknown[]; interactions: unknown[]; limitations: string[]; errors: string[]; generatedAt: string }

export type EditorDomNode = { uid: string; tag: string; id?: string; classes?: string[]; attributes?: Record<string, string>; text?: string; children?: EditorDomNode[]; visible?: boolean; styles?: Record<string, string>; [key: string]: unknown }
export type PageModel = { schemaVersion: '1.0'; projectId: string; sourceUrl: string; capturedAt: string; title: string; viewports: Array<Record<string, unknown>>; assets: Array<Record<string, unknown>>; metadata: { userAgent: string; durationMs: number; warnings: string[] }; navigation?: Record<string, unknown>; [key: string]: unknown }
export type ProjectEditorResponse = { project: { id: string; sourceUrl: string; status: string }; model: PageModel }
export type UpdateProjectModelResponse = { ok: true; status: 'edited'; model: PageModel }

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export type ApiClient = ReturnType<typeof createApiClient>

export function createApiClient(baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.VITE_API_BASE_URL) {
  const configured = Boolean(baseUrl)
  async function request<T>(path: string, token?: string, init?: RequestInit): Promise<T> {
    if (!baseUrl) throw new Error('API não configurada: defina NEXT_PUBLIC_API_BASE_URL.')
    let accessToken = token
    if (!accessToken && typeof window !== 'undefined') {
      const { getAccessToken } = await import('@/lib/supabase/client')
      accessToken = (await getAccessToken()) ?? undefined
    }
    let response: Response
    try {
      response = await fetch(`${baseUrl}${path}`, { ...init, headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...init?.headers } })
    } catch {
      throw new ApiError(0, 'Não foi possível contactar a API.')
    }
    if (!response.ok) {
      const messages: Record<number, string> = { 401: 'Sessão ausente ou expirada.', 403: 'Não tens acesso a este recurso.', 404: 'Recurso não encontrado.', 409: 'Conflito: o recurso foi alterado.', 422: 'Os dados enviados são inválidos.', 503: 'Serviço temporariamente indisponível.' }
      throw new ApiError(response.status, messages[response.status] ?? 'Ocorreu um erro ao comunicar com a API.')
    }
    if (response.status === 204) return undefined as T
    return response.json() as Promise<T>
  }
  return {
    configured,
    checkHealth: () => request<HealthResponse>('/health'),
    createCrawlJob: (url: string, token?: string) => request<CreateCrawlJobResponse>('/api/crawl-jobs', token, { method: 'POST', body: JSON.stringify({ url }) }),
    getCrawlJob: (id: string, token?: string) => request<CrawlJobStatus>(`/api/crawl-jobs/${encodeURIComponent(id)}`, token),
    listPages: (id: string, params: { offset?: number; limit?: number; status?: CrawlPageStatus } = {}, token?: string) => { const query = new URLSearchParams(); if (params.offset !== undefined) query.set('offset', String(params.offset)); if (params.limit !== undefined) query.set('limit', String(params.limit)); if (params.status) query.set('status', params.status); return request<CrawlPageListResponse>(`/api/crawl-jobs/${encodeURIComponent(id)}/pages?${query}`, token) },
    getSiteModel: (id: string, token?: string) => request<Record<string, unknown>>(`/api/crawl-jobs/${encodeURIComponent(id)}/site-model`, token),
    getPageModel: (id: string, pageKey: string, token?: string) => request<Record<string, unknown>>(`/api/crawl-jobs/${encodeURIComponent(id)}/pages/${encodeURIComponent(pageKey)}/page-model`, token),
    getReport: (id: string, format: 'json' | 'markdown' = 'json', token?: string) => format === 'markdown' ? request<string>(`/api/crawl-jobs/${encodeURIComponent(id)}/report?format=markdown`, token) : request<CrawlReport>(`/api/crawl-jobs/${encodeURIComponent(id)}/report?format=json`, token),
    getArtifacts: (id: string, path: string, token?: string) => request<Blob>(`/api/crawl-jobs/${encodeURIComponent(id)}/artifacts?path=${encodeURIComponent(path)}`, token),
    getProjectEditor: (id: string, token?: string) => request<ProjectEditorResponse>(`/api/projects/${encodeURIComponent(id)}/editor`, token),
    updateProjectEditor: (id: string, model: PageModel, token?: string) => request<UpdateProjectModelResponse>(`/api/projects/${encodeURIComponent(id)}/editor/model`, token, { method: 'PUT', body: JSON.stringify({ model }) }),
  }
}

export const apiClient = createApiClient()
export const isApiConfigured = apiClient.configured
