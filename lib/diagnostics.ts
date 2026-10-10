import { ApiError } from './api'

export type IntegrationDiagnostic =
  | 'supabase-not-configured'
  | 'api-not-configured'
  | 'api-inaccessible'
  | 'session-invalid'
  | 'resource-not-found'
  | 'authorization-error'
  | 'ready'

export function diagnoseIntegration({
  supabaseConfigured,
  apiConfigured,
  error,
}: {
  supabaseConfigured: boolean
  apiConfigured: boolean
  error?: unknown
}): IntegrationDiagnostic {
  if (!supabaseConfigured) return 'supabase-not-configured'
  if (error instanceof ApiError) {
    if (error.status === 401) return 'session-invalid'
    if (error.status === 403) return 'authorization-error'
    if (error.status === 404) return 'resource-not-found'
    if (error.status === 0) return 'api-inaccessible'
  }
  if (!apiConfigured) return 'api-not-configured'
  if (error instanceof ApiError && error.status === 0) return 'api-inaccessible'
  return error ? 'api-inaccessible' : 'ready'
}

export const diagnosticMessages: Record<IntegrationDiagnostic, string> = {
  'supabase-not-configured': 'Supabase não está configurado para esta aplicação.',
  'api-not-configured': 'A API do Offer Cloner Pro não está configurada.',
  'api-inaccessible': 'A API não está acessível neste momento.',
  'session-invalid': 'A sessão é inválida ou expirou. Inicia sessão novamente.',
  'resource-not-found': 'O recurso não existe ou não está acessível para esta sessão.',
  'authorization-error': 'A sessão não tem autorização para este recurso.',
  ready: 'A configuração base está disponível.',
}

export function getSafeDiagnosticMessage(diagnostic: IntegrationDiagnostic) {
  return diagnosticMessages[diagnostic]
}

export function getIntegrationConfig() {
  return {
    supabaseConfigured: Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_PUBLISHABLE_KEY),
    apiConfigured: Boolean(process.env.VITE_API_BASE_URL),
  }
}

export const requiredEnvironmentVariables = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_API_BASE_URL',
] as const

export type RequiredEnvironmentVariable = (typeof requiredEnvironmentVariables)[number]

export function getMissingEnvironmentVariables(config = getIntegrationConfig()) {
  const missing: RequiredEnvironmentVariable[] = []
  if (!config.supabaseConfigured) missing.push('VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY')
  if (!config.apiConfigured) missing.push('VITE_API_BASE_URL')
  return missing
}

export function isSafeDiagnosticMessage(message: string) {
  return !/(bearer|token|secret|publishable_key|service_role|password)/i.test(message)
}

if (typeof window !== 'undefined') {
  // Keep diagnostics discoverable without exposing configuration values or session data.
  window.dispatchEvent(new CustomEvent('offer-cloner:diagnostic-ready'))
}
