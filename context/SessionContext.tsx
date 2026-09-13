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
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import type { SessionMember, Room, Member } from '@/types/database'

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
export function SessionProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [session, setSessionState] = useState<SessionMember | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const setSession = useCallback((s: SessionMember | null) => {
    setSessionState(s)
    if (s) {
      saveSession(s)
    } else {
      clearSession()
    }
  }, [])

  const refreshSession = useCallback(async () => {
    const current = loadSession()
    if (!current) {
      setIsLoading(false)
      return
    }

    try {
      // Verify member and room still exist in Firestore
      const memberDocRef = doc(db, 'rooms', current.room_id, 'members', current.id)
      const roomDocRef = doc(db, 'rooms', current.room_id)

      const [memberSnap, roomSnap] = await Promise.all([
        getDoc(memberDocRef),
        getDoc(roomDocRef),
      ])

      if (memberSnap.exists() && roomSnap.exists()) {
        const memberData = memberSnap.data() as Member
        const roomData = { id: roomSnap.id, ...roomSnap.data() } as Room

        // Check if device token matches
        if (memberData.device_token === current.device_token) {
          const refreshed: SessionMember = {
            ...memberData,
            id: memberSnap.id,
            room: roomData,
          }
          setSessionState(refreshed)
          saveSession(refreshed)
        } else {
          clearSession()
          setSessionState(null)
        }
      } else {
        // Stale session
        clearSession()
        setSessionState(null)
      }
    } catch (err) {
      // In case network/offline or offline cache
      console.warn('Session refresh warning:', err)
      setSessionState(current)
    } finally {
      setIsLoading(false)
    }
  }, [])

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
