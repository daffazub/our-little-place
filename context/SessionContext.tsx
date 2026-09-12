'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { loadSession, saveSession, clearSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import type { SessionMember } from '@/types/database'

// ─── Context types ────────────────────────────────────────────
interface SessionContextValue {
  session: SessionMember | null
  isLoading: boolean
  isOwner: boolean
  setSession: (s: SessionMember | null) => void
  logout: () => void
  refreshSession: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<SessionMember | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Attach device_token header to all Supabase requests
  const attachDeviceToken = useCallback((token: string) => {
    try {
      supabase.realtime.setAuth(token)
    } catch {
      // Realtime auth is optional or may fail if disconnected
    }
    try {
      const clientAny = supabase as unknown as {
        rest?: { headers?: Record<string, string> }
        storage?: { headers?: Record<string, string> }
      }
      if (clientAny.rest?.headers) {
        clientAny.rest.headers['x-device-token'] = token
      }
      if (clientAny.storage?.headers) {
        clientAny.storage.headers['x-device-token'] = token
      }
    } catch {
      // Safe fallback if internal structure changes
    }
  }, [])

  const setSession = useCallback(
    (s: SessionMember | null) => {
      setSessionState(s)
      if (s) {
        saveSession(s)
        attachDeviceToken(s.device_token)
      } else {
        clearSession()
      }
    },
    [attachDeviceToken]
  )

  const refreshSession = useCallback(async () => {
    const current = loadSession()
    if (!current) { setIsLoading(false); return }

    // Verify member still exists in DB
    const { data } = await supabase
      .from('members')
      .select('*, room:rooms(*)')
      .eq('id', current.id)
      .eq('device_token', current.device_token)
      .single()

    if (data) {
      const refreshed: SessionMember = {
        ...(data as Omit<SessionMember, 'room'>),
        room: (data as any).room,
      }
      setSessionState(refreshed)
      attachDeviceToken(refreshed.device_token)
    } else {
      clearSession()
      setSessionState(null)
    }
    setIsLoading(false)
  }, [attachDeviceToken])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  const logout = useCallback(() => {
    setSession(null)
  }, [setSession])

  const isOwner = session?.role === 'owner'

  return (
    <SessionContext.Provider
      value={{ session, isLoading, isOwner, setSession, logout, refreshSession }}
    >
      {children}
    </SessionContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────
export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}

export function useMember() {
  return useSession().session
}

export function useRoom() {
  return useSession().session?.room ?? null
}

export function useIsOwner() {
  return useSession().isOwner
}

