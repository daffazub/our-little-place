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
  Gift,
  Settings,
  Home,
} from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import { getActiveInviteTokens, generateInviteToken } from '@/lib/services/rooms'

export default function RoomNavbar() {
  const { session, logout, isOwner } = useSession()
  const pathname = usePathname()
  const [copied, setCopied] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  if (!session) return null

  const roomId = session.room_id
  const roomName = session.room?.name || 'Our Little Place'

  const navItems = [
    { label: 'Beranda', href: `/room/${roomId}`, icon: Home },
    { label: 'Kenangan', href: `/room/${roomId}/memories`, icon: ImageIcon },
    { label: 'Cerita', href: `/room/${roomId}/stories`, icon: BookOpen },
    { label: 'Rencana', href: `/room/${roomId}/plans`, icon: Calendar },
    { label: 'Kalender', href: `/room/${roomId}/calendar`, icon: Gift },
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
            // fallback
          }
        }
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(inviteUrl)
          setCopied(true)
          setTimeout(() => setCopied(false), 2500)
        }
      }
    } catch (err) {
      console.error('Failed to copy/share invite token:', err)
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-line)',
        boxShadow: '0 1px 6px var(--color-line-soft)',
      }}
    >
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
        {/* Left: Brand & Room Name */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/room/${roomId}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-[var(--color-ink)] transition-colors hover:bg-[var(--color-clay)] hover:text-[var(--color-clay-contrast)]"
            style={{
              background: 'var(--color-sunken)',
              borderColor: 'var(--color-line)',
            }}
          >
            <Sparkles className="w-5 h-5 text-[var(--color-clay)]" />
          </Link>
          <div className="truncate">
            <h1
              className="truncate font-display text-base font-semibold leading-tight text-[var(--color-ink)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {roomName}
            </h1>
            <p className="truncate font-body text-xs text-[var(--color-ink-soft)]">
              {session.role === 'owner' ? 'Pemilik room' : 'Anggota room'}
            </p>
          </div>
        </div>

        {/* Center: Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 border-b-2 border-transparent px-2.5 py-2 font-display text-xs font-medium transition-colors hover:border-[var(--color-clay)] hover:text-[var(--color-ink)] cursor-pointer"
                style={
                  isActive
                    ? {
                        background: 'var(--color-clay)',
                        color: 'var(--color-clay-contrast)',
                        borderColor: 'var(--color-clay)',
                        fontWeight: 600,
                      }
                    : {
                        color: 'var(--color-ink-soft)',
                      }
                }
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
            className="flex items-center gap-1.5 border border-[var(--color-ink)] px-3 py-2 font-display text-xs font-medium transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] cursor-pointer"
            style={{
              borderColor: 'var(--color-line)',
              background: 'var(--color-surface)',
              color: 'var(--color-ink)',
            }}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[var(--color-sage-deep)]" />
                <span className="hidden sm:inline text-[var(--color-sage-deep)] font-bold">Tersalin!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[var(--color-clay)]" />
                <span className="hidden sm:inline">Undang</span>
              </>
            )}
          </button>

          {/* Member Avatar */}
          <div className="flex items-center gap-2 pl-1">
            <div className="h-9 w-9 overflow-hidden border border-[var(--color-ink)] bg-[var(--color-sunken)]" style={{ borderColor: 'var(--color-line)' }}>
              {session.avatar_url ? (
                <img
                  src={session.avatar_url}
                  alt={session.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xs text-[var(--color-clay)]">
                  {session.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowLogoutModal(true)}
              title="Keluar dari room"
              className="p-2 text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-danger-tint)] hover:text-[var(--color-error)] cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Dialog Konfirmasi Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)] backdrop-blur-xs animate-in fade-in">
          <div
            className="rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-center border"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-line)',
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-[var(--danger-tint)] text-[var(--color-error)]">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-heading)' }}>
                Keluar dari Ruang Kenangan?
              </h3>
              <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
                Kamu dapat bergabung kembali kapan saja menggunakan tautan undangan ruangan ini.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-full text-xs font-semibold text-[var(--color-ink)] bg-[var(--color-sunken)] hover:bg-[var(--color-line)] transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false)
                  logout()
                  if (typeof window !== 'undefined') {
                    window.location.href = '/create'
                  }
                }}
                className="flex-1 py-2.5 rounded-full text-xs font-bold text-[var(--color-white)] transition-colors hover:opacity-90 cursor-pointer shadow-sm"
                style={{
                  background: 'var(--color-error)',
                }}
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

