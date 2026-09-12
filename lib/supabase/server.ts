import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Server-side Supabase client for Server Components and Route Handlers
// Attaches device_token from cookie as a custom header for RLS
export async function getSupabaseServerClient() {
  const cookieStore = await cookies()
  const deviceToken = cookieStore.get('olp_device_token')?.value ?? ''
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co'
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}, // Server components can't set cookies
      },
      global: {
        headers: {
          'x-device-token': deviceToken,
        },
      },
    }
  )
}

