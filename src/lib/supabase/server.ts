import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function looksLikePlaceholder(value: string) {
  const v = value.toLowerCase()
  return (
    !v ||
    v.includes('your_project') ||
    v.includes('your-') ||
    v.includes('example') ||
    v.includes('changeme') ||
    v === 'https://your_project.supabase.co'
  )
}

/** Legacy `service_role` JWT or new `sb_secret_...` — same elevated server role. */
export function getSupabaseSecretKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    ''
  )
}

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = getSupabaseSecretKey()
  if (!url || !key) return false
  if (looksLikePlaceholder(url) || looksLikePlaceholder(key)) return false
  try {
    const host = new URL(url).hostname
    if (!host.endsWith('.supabase.co') && !host.includes('localhost')) {
      // Allow custom domains, but still reject obvious placeholders
      if (host.includes('your_project')) return false
    }
  } catch {
    return false
  }
  return true
}

export function getServiceSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(), getSupabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
