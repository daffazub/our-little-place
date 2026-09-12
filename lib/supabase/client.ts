import { createBrowserClient } from '@supabase/ssr'

// Singleton browser client — reused across all components
let client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co'
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
    client = createBrowserClient(url, anonKey)
  }
  return client
}

// Convenience shorthand used in client components
export const supabase = getSupabaseBrowserClient()

