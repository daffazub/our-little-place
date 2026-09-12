'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Image as ImageIcon, BookOpen, Calendar, Settings } from 'lucide-react'

interface BottomNavProps {
  roomId: string
}

export default function BottomNav({ roomId }: BottomNavProps) {
  const pathname = usePathname()

  const tabs = [
    { label: 'Beranda', href: `/room/${roomId}`, icon: Home },
    { label: 'Kenangan', href: `/room/${roomId}/memories`, icon: ImageIcon },
    { label: 'Cerita', href: `/room/${roomId}/stories`, icon: BookOpen },
    { label: 'Rencana', href: `/room/${roomId}/plans`, icon: Calendar },
    { label: 'Setting', href: `/room/${roomId}/settings`, icon: Settings },
  ]

  return (
    <nav
      aria-label="Mobile navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--border)] px-2 py-1.5"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                isActive
                  ? 'text-[var(--accent-text)] scale-105'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

