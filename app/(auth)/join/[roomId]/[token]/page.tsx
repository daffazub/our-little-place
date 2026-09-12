'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Users, User, AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react'
import { joinRoom } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import { useSession } from '@/context/SessionContext'
import type { Room } from '@/types/database'

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aria&backgroundColor=0f766e',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Kai&backgroundColor=b45309',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe&backgroundColor=e11d48',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Finn&backgroundColor=65a30d',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Sky&backgroundColor=57534e',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Jade&backgroundColor=0f766e',
]

export default function JoinRoomPage() {
  const router = useRouter()
  const params = useParams<{ roomId: string; token: string }>()
  const { setSession } = useSession()

  const [room, setRoom] = useState<Room | null>(null)
  const [isValidating, setIsValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [memberName, setMemberName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; general?: string }>({})

  // Validate token on mount
  useEffect(() => {
    async function validate() {
      setIsValidating(true)
      const { data: tokenRow } = await supabase
        .from('invite_tokens')
        .select('*, room:rooms(*)')
        .eq('room_id', params.roomId)
        .eq('token', params.token)
        .eq('revoked', false)
        .single()

      if (tokenRow?.room) {
        setRoom(tokenRow.room as unknown as Room)
        setTokenValid(true)
      } else {
        setTokenValid(false)
      }
      setIsValidating(false)
    }
    if (params.roomId && params.token) validate()
  }, [params.roomId, params.token])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memberName.trim() || memberName.trim().length < 2) {
      setErrors({ name: 'Nama kamu minimal 2 karakter, ya!' })
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const session = await joinRoom(params.roomId, params.token, memberName.trim(), selectedAvatar)
      setSession(session)
      router.push(`/room/${params.roomId}`)
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Gagal bergabung ke room.' })
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (isValidating) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-4 bg-[var(--canvas)]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto skeleton rounded-2xl" />
          <div className="w-48 h-4 mx-auto skeleton rounded-full" />
          <div className="w-32 h-3 mx-auto skeleton rounded-full" />
        </div>
      </main>
    )
  }

  // Invalid token
  if (!tokenValid) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-4 bg-[var(--canvas)]">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[var(--danger-tint)] flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-[var(--danger)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Link Tidak Valid</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Invite link ini sudah tidak aktif atau telah direvoke oleh owner room.
            Minta link baru dari pemilik room.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 bg-[var(--canvas)]">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[var(--accent)] flex items-center justify-center shadow-lg mb-4">
            <Users className="w-8 h-8 text-[var(--accent-contrast)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Bergabung ke{' '}
            <span className="text-[var(--accent-text)]">{room?.name}</span>
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xs mx-auto">
            Kamu diundang untuk menjadi bagian dari ruang kenangan ini.
          </p>
        </div>

        <form
          onSubmit={handleJoin}
          className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 shadow-sm space-y-5"
        >
          {errors.general && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--danger-tint)] text-[var(--danger-text)] text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errors.general}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[var(--warm)]" />
              Nama Kamu *
            </label>
            <input
              type="text"
              value={memberName}
              onChange={e => { setMemberName(e.target.value); setErrors(p => ({ ...p, name: undefined })) }}
              placeholder="Contoh: Maya, David, Yoga..."
              className={`w-full px-4 py-3 rounded-2xl bg-[var(--surface-subtle)] border text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all ${
                errors.name
                  ? 'border-[var(--danger)]'
                  : 'border-[var(--border)] focus:border-[var(--accent-border)]'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-[var(--danger-text)] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.name}
              </p>
            )}
          </div>

          {/* Avatar Picker */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
              Pilih Avatar
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {AVATAR_OPTIONS.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setSelectedAvatar(url)}
                  className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-all ${
                    selectedAvatar === url
                      ? 'border-[var(--accent)] scale-110 shadow-md'
                      : 'border-transparent hover:border-[var(--border-strong)]'
                  }`}
                >
                  <img src={url} alt="avatar" className="w-full h-full" />
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-contrast)] rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-97 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Bergabung...
              </>
            ) : (
              <>
                Masuk ke Room
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[11px] text-[var(--text-muted)] mt-4 max-w-xs mx-auto leading-relaxed">
          🔒 Link ini bersifat pribadi. Tolong jangan disebar ke luar circle.
        </p>
      </div>
    </main>
  )
}

