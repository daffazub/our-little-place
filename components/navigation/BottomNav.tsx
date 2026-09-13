'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Image as ImageIcon, BookOpen, Calendar, Settings } from 'lucide-react'

interface BottomNavProps {
  roomId: string
}

const TABS = [
  { label: 'Beranda',  icon: Home,       href: (id: string) => `/room/${id}` },
  { label: 'Kenangan', icon: ImageIcon,   href: (id: string) => `/room/${id}/memories` },
  { label: 'Cerita',   icon: BookOpen,    href: (id: string) => `/room/${id}/stories` },
  { label: 'Rencana',  icon: Calendar,    href: (id: string) => `/room/${id}/plans` },
  { label: 'Setting',  icon: Settings,    href: (id: string) => `/room/${id}/settings` },
]

export default function BottomNav({ roomId }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Mobile navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md border-t"
      style={{
        background: 'rgba(255,255,255,0.92)',
        borderColor: 'var(--border)',
        boxShadow: '0 -4px 16px rgba(168,213,186,0.12)',
      }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto px-2 py-1.5">
        {TABS.map(({ label, icon: Icon, href }) => {
          const path = href(roomId)
          const isActive = pathname === path
          return (
            <Link
              key={path}
              href={path}
              className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all"
              style={
                isActive
                  ? { color: 'var(--joy-charcoal)' }
                  : { color: 'var(--text-muted)' }
              }
            >
              {/* Active indicator dot */}
              {isActive && (
                <span
                  className="w-5 h-1 rounded-full mb-0.5"
                  style={{ background: 'var(--gradient-memory)' }}
                />
              )}
              {!isActive && <span className="w-5 h-1 mb-0.5" />}

              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span
                className="text-[10px] mt-0.5"
                style={{ fontWeight: isActive ? 700 : 500 }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
