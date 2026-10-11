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
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
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

  it('envia o Bearer token e o corpo PUT', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    const client = createApiClient('https://api.test')
    await client.updateProjectEditor('project-1', { schemaVersion: '1.0' } as never, 'token-test')
    expect(fetchMock).toHaveBeenCalledWith('https://api.test/api/projects/project-1/editor/model', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ model: { schemaVersion: '1.0' } }),
      headers: expect.objectContaining({ Authorization: 'Bearer token-test' }),
    }))
  })

  it.each([[401, 'Sessão ausente ou expirada.'], [403, 'Não tens acesso a este recurso.'], [404, 'Recurso não encontrado.'], [422, 'Os dados enviados são inválidos.'], [503, 'Serviço temporariamente indisponível.']])('mapeia HTTP %s sem expor resposta do servidor', async (status, message) => {
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
