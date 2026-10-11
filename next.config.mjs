/** @type {import('next').NextConfig} */
const nextPublicApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.VITE_API_BASE_URL
const nextPublicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const nextPublicSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY

const nextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE_URL: nextPublicApiBaseUrl,
    NEXT_PUBLIC_SUPABASE_URL: nextPublicSupabaseUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: nextPublicSupabaseKey,
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || nextPublicApiBaseUrl,
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || nextPublicSupabaseUrl,
    VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY || nextPublicSupabaseKey,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
