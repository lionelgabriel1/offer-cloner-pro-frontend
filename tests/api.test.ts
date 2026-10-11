import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, createApiClient } from '../lib/api'
import { diagnoseIntegration, getMissingEnvironmentVariables, isSafeDiagnosticMessage } from '../lib/diagnostics'

afterEach(() => vi.restoreAllMocks())

describe('cliente API protegido', () => {
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
})

describe('diagnóstico de integração', () => {
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
