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
    <div className="flex flex-col min-h-dvh bg-[var(--canvas)]">
      {/* Top navbar */}
      <RoomNavbar />

      {/* Main content area with bottom padding for BottomNav */}
      <main className="flex-1 pb-20 lg:pb-0 lg:pl-64">
        {children}
      </main>

      {/* Desktop sidebar (hidden on mobile) */}
      <aside className="hidden lg:block fixed left-0 top-0 h-full w-64 z-30" aria-label="Sidebar navigasi">
        {/* Sidebar rendered inside RoomNavbar on desktop for simplicity */}
      </aside>

      {/* Mobile bottom nav (hidden on desktop) */}
      <BottomNav roomId={params.roomId} />

      {/* Persistent audio dock — always visible, never unmounts */}
      <AudioDock />
    </div>
  )
}

