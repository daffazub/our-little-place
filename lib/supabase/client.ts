import { createBrowserClient } from '@supabase/ssr'

// Singleton browser client — reused across all components
let client: ReturnType<typeof createBrowserClient> | null = null

function getStoredDeviceToken(): string {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem('olp_device_token') || ''
  } catch {
    return ''
  }
}

export function getSupabaseBrowserClient() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co'
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
    client = createBrowserClient(url, anonKey)
    const token = getStoredDeviceToken()

    client = createBrowserClient(url, anonKey, {
      global: {
        headers: token ? { 'x-device-token': token } : {},
      },
    })
  }
  return client
}

export function setSupabaseDeviceToken(token: string) {
  const currentClient = getSupabaseBrowserClient()
  try {
    const clientAny = currentClient as unknown as {
      rest?: { headers?: Record<string, string> }
      storage?: { headers?: Record<string, string> }
    }
    if (clientAny.rest?.headers) {
      clientAny.rest.headers['x-device-token'] = token
    }
    if (clientAny.storage?.headers) {
      clientAny.storage.headers['x-device-token'] = token
    }
    currentClient.realtime.setAuth(token)
  } catch {
    // safe fallback
  }
}

// Convenience shorthand used in client components
export const supabase = getSupabaseBrowserClient()

