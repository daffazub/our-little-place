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
      aria-label="Navigasi Mobile"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-ink)] bg-[var(--color-paper)] pb-[env(safe-area-inset-bottom)] lg:hidden"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-line)',
        boxShadow: '0 -2px 10px var(--color-line-soft)',
      }}
    >
      <div className="mx-auto flex max-w-xl items-center justify-around px-2 py-2">
        {TABS.map(({ label, icon: Icon, href }) => {
          const path = href(roomId)
          const isActive = pathname === path
          return (
            <Link
              key={path}
              href={path}
              className="flex min-h-11 flex-col items-center justify-center border-b-2 border-transparent px-3 py-1 transition-colors cursor-pointer"
              style={{
                color: isActive ? 'var(--color-clay)' : 'var(--color-ink-soft)',
              }}
            >
              {/* Active indicator bar */}
              {isActive ? (
                <span
                  className="w-5 h-1 rounded-full mb-0.5"
                  style={{ background: 'var(--color-clay)' }}
                />
              ) : (
                <span className="w-5 h-1 mb-0.5" />
              )}

              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span
                className="mt-1 font-display text-[10px]"
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

