import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, createApiClient, isValidHttpUrl } from '../lib/api'
import {
  diagnoseIntegration,
  getIntegrationConfig,
  getMissingEnvironmentVariables,
  isSafeDiagnosticMessage,
} from '../lib/diagnostics'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('cliente API protegido', () => {
  it.each([
    ['https://example.com', true],
    ['http://localhost:3000/path', true],
    ['ftp://example.com', false],
    ['example.com', false],
    ['not a url', false],
  ])('valida URL %s', (value, expected) => {
    expect(isValidHttpUrl(value)).toBe(expected)
  })

  it('usa a resposta real de /health', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } }))
    await expect(createApiClient('https://api.test').checkHealth()).resolves.toEqual({ ok: true })
  })

  it('trata falha HTTP do endpoint /health', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('unavailable', { status: 503 }))
    await expect(createApiClient('https://api.test').checkHealth()).rejects.toEqual(expect.objectContaining({ status: 503, message: 'Serviço temporariamente indisponível.' }))
  })

  it('trata erro ao iniciar um rastreamento', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('backend error', { status: 503 }))
    await expect(createApiClient('https://api.test').createCrawlJob('https://example.com')).rejects.toEqual(expect.objectContaining({ status: 503, message: 'Serviço temporariamente indisponível.' }))
  })

  it('não permite que URLs inválidos cheguem ao cliente da API', () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    for (const value of ['javascript:alert(1)', 'file:///tmp/site.html', 'ftp://example.com', 'not a url']) {
      expect(isValidHttpUrl(value)).toBe(false)
    }
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('envia o Bearer token e o corpo PUT', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    const client = createApiClient('https://api.test')
    await client.updateProjectEditor('project-1', { schemaVersion: '1.0' } as never, 'token-test')
    expect(fetchMock).toHaveBeenCalledWith('https://api.test/api/projects/project-1/editor/model', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ model: { schemaVersion: '1.0' } }),
    }))
    const request = fetchMock.mock.calls[0][1]
    expect(new Headers(request?.headers).get('Authorization')).toBe('Bearer token-test')
  })

  it('envia as opções de retoma no formato direto esperado pela API', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ jobId: 'job-1', status: 'running' }), { status: 202, headers: { 'content-type': 'application/json' } }))
    await createApiClient('https://api.test').resumeCrawlJob('job-1', { maxDepth: 2 }, 'token-test')
    expect(fetchMock).toHaveBeenCalledWith('https://api.test/api/crawl-jobs/job-1/resume', expect.objectContaining({ method: 'POST', body: JSON.stringify({ maxDepth: 2 }) }))
  })

  it('cria um projeto editor a partir do Page Model do crawl com Bearer token', async () => {
    const response = { project: { id: 'project-1', sourceUrl: 'https://example.com/', status: 'ready' }, model: { projectId: 'project-1' } }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(response), { status: 201, headers: { 'content-type': 'application/json' } }))
    await expect(createApiClient('https://api.test').createEditorProjectFromCrawl('job-1', 'page/key', 'token-test')).resolves.toEqual(response)
    expect(fetchMock).toHaveBeenCalledWith('https://api.test/api/crawl-jobs/job-1/editor-project', expect.objectContaining({ method: 'POST', body: JSON.stringify({ pageKey: 'page/key' }) }))
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer token-test')
  })

  it.each([[401, 'Sessão ausente ou expirada.'], [403, 'Não tens acesso a este recurso ou origem.'], [404, 'Recurso não encontrado.'], [422, 'A operação foi rejeitada. Verifica o URL e as opções.'], [503, 'Serviço temporariamente indisponível.']])('mapeia HTTP %s sem expor resposta do servidor', async (status, message) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('segredo interno', { status }))
    const client = createApiClient('https://api.test')
    await expect(client.getCrawlJob('job-1', 'token-test')).rejects.toEqual(expect.objectContaining({ status, message }))
  })

  it('distingue API não configurada e falha de rede', async () => {
    await expect(createApiClient().getCrawlJob('job-1')).rejects.toThrow('API não configurada')
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'))
    await expect(createApiClient('https://api.test').getCrawlJob('job-1', 'token-test')).rejects.toEqual(expect.objectContaining({ status: 0, message: 'Não foi possível contactar a API.' }))
  })

  it('expõe erros tipados', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 409 }))
    await expect(createApiClient('https://api.test').getCrawlJob('job-1', 'token-test')).rejects.toBeInstanceOf(ApiError)
  })

  it('preserva relatórios Markdown e obtém artifacts binários com path codificado', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('# Relatório', { status: 200, headers: { 'content-type': 'text/markdown' } }))
      .mockResolvedValueOnce(new Response(new Uint8Array([137, 80, 78, 71]), { status: 200, headers: { 'content-type': 'image/png' } }))
    const client = createApiClient('https://api.test/')
    expect(await client.getReport('job-1', 'markdown', 'token-test')).toBe('# Relatório')
    const artifact = await client.getArtifacts('job-1', 'screenshots/a b.png', 'token-test')
    expect(artifact).toBeInstanceOf(Blob)
    expect([...new Uint8Array(await artifact.arrayBuffer())]).toEqual([137, 80, 78, 71])
    expect(fetchMock.mock.calls[1][0]).toBe('https://api.test/api/crawl-jobs/job-1/artifacts?path=screenshots%2Fa%20b.png')
    expect(new Headers(fetchMock.mock.calls[1][1]?.headers).get('Authorization')).toBe('Bearer token-test')
  })

  it('consulta health sem enviar bearer token', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } }))
    await createApiClient('https://api.test').getHealth()
    const request = fetchMock.mock.calls[0][1]
    expect(new Headers(request?.headers).has('Authorization')).toBe(false)
  })

  it('lista projetos e crawls com paginação e Bearer token', async () => {
    const pagination = { offset: 2, limit: 5, total: 8, hasMore: true }
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify({ jobs: [], pagination }), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ projects: [], pagination }), { status: 200, headers: { 'content-type': 'application/json' } }))
    const client = createApiClient('https://api.test')
    await expect(client.listCrawlJobs({ offset: 2, limit: 5 }, 'token-test')).resolves.toEqual({ jobs: [], pagination })
    await expect(client.listProjects({ offset: 2, limit: 5 }, 'token-test')).resolves.toEqual({ projects: [], pagination })
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/api/crawl-jobs?offset=2&limit=5')
    expect(fetchMock.mock.calls[1][0]).toBe('https://api.test/api/projects?offset=2&limit=5')
    for (const [, request] of fetchMock.mock.calls) expect(new Headers(request?.headers).get('Authorization')).toBe('Bearer token-test')
  })
})

describe('diagnóstico de integração', () => {
  it('prefere variáveis NEXT_PUBLIC e mantém fallback VITE', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://next.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_next')
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://next.api.test')
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '')
    vi.stubEnv('VITE_API_BASE_URL', '')

    expect(getIntegrationConfig()).toEqual({ supabaseConfigured: true, apiConfigured: true })
    expect(getMissingEnvironmentVariables()).toEqual([])

    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '')
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_URL', 'https://legacy.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_legacy')
    vi.stubEnv('VITE_API_BASE_URL', 'https://legacy.api.test')

    expect(getIntegrationConfig()).toEqual({ supabaseConfigured: true, apiConfigured: true })
  })

  it('distingue configuração ausente sem revelar valores', () => {
    expect(getMissingEnvironmentVariables({ supabaseConfigured: false, apiConfigured: false })).toEqual([
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      'NEXT_PUBLIC_API_BASE_URL',
    ])
    expect(isSafeDiagnosticMessage('A API não está acessível neste momento.')).toBe(true)
    expect(isSafeDiagnosticMessage('Bearer token secreto')).toBe(false)
  })

  it('classifica falhas de sessão, autorização e recurso', () => {
    expect(diagnoseIntegration({ supabaseConfigured: true, apiConfigured: true, error: new ApiError(401, 'safe') })).toBe('session-invalid')
    expect(diagnoseIntegration({ supabaseConfigured: true, apiConfigured: true, error: new ApiError(403, 'safe') })).toBe('authorization-error')
    expect(diagnoseIntegration({ supabaseConfigured: true, apiConfigured: true, error: new ApiError(404, 'safe') })).toBe('resource-not-found')
  })
})
