import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, createApiClient } from '../lib/api'

afterEach(() => vi.restoreAllMocks())

describe('cliente API protegido', () => {
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
