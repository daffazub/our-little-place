'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sparkles,
  Share2,
  Check,
  LogOut,
  Image as ImageIcon,
  Calendar,
  BookOpen,
  Quote,
  Heart,
  Settings,
  Home,
} from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import { getActiveInviteTokens, generateInviteToken } from '@/lib/auth'

export default function RoomNavbar() {
  const { session, logout, isOwner } = useSession()
  const pathname = usePathname()
  const [copied, setCopied] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  if (!session) return null

  const roomId = session.room_id
  const roomName = session.room?.name || 'Our Little Place'

  const navItems = [
    { label: 'Beranda', href: `/room/${roomId}`, icon: Home },
    { label: 'Kenangan', href: `/room/${roomId}/memories`, icon: ImageIcon },
    { label: 'Cerita', href: `/room/${roomId}/stories`, icon: BookOpen },
    { label: 'Rencana', href: `/room/${roomId}/plans`, icon: Calendar },
    { label: 'Quotes', href: `/room/${roomId}/quotes`, icon: Quote },
    { label: 'Hal Kecil', href: `/room/${roomId}/little-things`, icon: Heart },
    { label: 'Pengaturan', href: `/room/${roomId}/settings`, icon: Settings },
  ]

  const handleCopyInvite = async () => {
    try {
      setIsSharing(true)
      let token = ''
      const tokens = await getActiveInviteTokens(roomId)
      if (tokens.length > 0) {
        token = tokens[0].token
      } else if (isOwner) {
        token = await generateInviteToken(roomId, session.id)
      }

      if (token && typeof window !== 'undefined') {
        const inviteUrl = `${window.location.origin}/join/${roomId}/${token}`
        if (navigator.share) {
          try {
            await navigator.share({
              title: `Undangan Bergabung ke ${roomName}`,
              text: `Yuk gabung ke ruang kenangan kita "${roomName}":`,
              url: inviteUrl,
            })
            setCopied(true)
            setTimeout(() => setCopied(false), 2500)
            return
          } catch {
            // If user closed share dialog, fallback to copy
          }
        }
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(inviteUrl)
          setCopied(true)
          setTimeout(() => setCopied(false), 2500)
        }
      }
    } catch (err) {
      console.error('Failed to share invite token:', err)
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Room Name */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/room/${roomId}`}
            className="w-10 h-10 rounded-2xl bg-[var(--accent)] flex items-center justify-center shrink-0 shadow-sm"
          >
            <Sparkles className="w-5 h-5 text-[var(--accent-contrast)]" />
          </Link>
          <div className="truncate">
            <h1 className="text-base font-bold text-[var(--text-primary)] truncate leading-tight">
              {roomName}
            </h1>
            <p className="text-xs text-[var(--text-muted)] truncate">
              {session.role === 'owner' ? '👑 Pemilik Room' : 'Sahabat'}
            </p>
          </div>
        </div>

        {/* Center: Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.slice(0, 6).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                  isActive
                    ? 'bg-[var(--accent-tint)] text-[var(--accent-text)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyInvite}
            disabled={isSharing}
            title="Salin link undangan"
            className="px-3 py-1.5 rounded-xl border border-[var(--border)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-tint)] text-[var(--accent-text)] text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[var(--success)]" />
                <span className="hidden sm:inline text-[var(--success-text)]">Tersalin!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Undang</span>
              </>
            )}
          </button>

          {/* Member Avatar */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-elevated)]">
              {session.avatar_url ? (
                <img
                  src={session.avatar_url}
                  alt={session.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xs text-[var(--accent-text)]">
                  {session.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <button
              onClick={() => logout()}
              title="Keluar"
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-tint)] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

