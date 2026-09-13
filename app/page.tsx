'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadSession } from '@/lib/auth'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const session = loadSession()
    if (session?.room_id) {
      router.replace(`/room/${session.room_id}`)
    } else {
      router.replace('/create')
    }
  }, [router])

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--canvas)]">
      <div className="space-y-3 text-center">
        <div className="w-12 h-12 mx-auto skeleton rounded-2xl" />
        <div className="w-36 h-3 mx-auto skeleton rounded-full" />
      </div>
    </div>
  )
}
