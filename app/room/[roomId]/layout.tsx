'use client'

import React, { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from '@/context/SessionContext'
import AudioDock from '@/components/audio/AudioDock'
import RoomNavbar from '@/components/navigation/Navbar'
import BottomNav from '@/components/navigation/BottomNav'

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useSession()
  const params = useParams<{ roomId: string }>()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/create')
    } else if (!isLoading && session && session.room_id !== params.roomId) {
      // Session exists but for a different room — redirect to their room
      router.replace(`/room/${session.room_id}`)
    }
  }, [isLoading, session, params.roomId, router])

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--canvas)]">
        <div className="space-y-3 text-center">
          <div className="w-12 h-12 mx-auto skeleton rounded-2xl" />
          <div className="w-40 h-3 mx-auto skeleton rounded-full" />
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--canvas)]" data-hallmark-scope="app">
      {/* Top navbar */}
      <RoomNavbar />

      {/* Main content area with safe padding for BottomNav + AudioDock */}
      <main className="room-main flex-1">
        {children}
      </main>

      {/* Mobile bottom nav (hidden on desktop) */}
      <BottomNav roomId={params.roomId} />

      {/* Persistent audio dock — always visible, never unmounts */}
      <AudioDock />
    </div>
  )
}

