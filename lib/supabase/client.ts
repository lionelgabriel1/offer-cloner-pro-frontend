import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) return null
  client ??= createBrowserClient(url, key)
  return client
}

export function isSupabaseConfigured() {
  return Boolean((process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL) && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY))
}

export function authErrorMessage(message?: string) {
  if (!message) return 'Não foi possível concluir a operação.'
  const normalized = message.toLowerCase()
  if (normalized.includes('invalid login credentials')) return 'Email ou palavra-passe inválidos.'
  if (normalized.includes('email not confirmed')) return 'Confirma o teu email antes de iniciar sessão.'
  if (normalized.includes('rate limit')) return 'Demasiadas tentativas. Tenta novamente mais tarde.'
  if (normalized.includes('password')) return 'A palavra-passe não cumpre os requisitos.'
  return 'O serviço de autenticação não está disponível neste momento.'
}

export type SupabaseClient = NonNullable<ReturnType<typeof createClient>>

export async function getAccessToken() {
  const supabase = createClient()
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}
