'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, User, Home, ArrowRight, AlertCircle } from 'lucide-react'
import { createRoom } from '@/lib/auth'
import { useSession } from '@/context/SessionContext'

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=0f766e',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Lily&backgroundColor=b45309',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Max&backgroundColor=e11d48',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Nova&backgroundColor=65a30d',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna&backgroundColor=57534e',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Star&backgroundColor=0f766e',
]

export default function CreateRoomPage() {
  const router = useRouter()
  const { setSession } = useSession()

  const [roomName, setRoomName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ roomName?: string; ownerName?: string; general?: string }>({})

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!roomName.trim() || roomName.trim().length < 2)
      newErrors.roomName = 'Nama tempat minimal 2 karakter, ya!'
    if (!ownerName.trim() || ownerName.trim().length < 2)
      newErrors.ownerName = 'Nama kamu minimal 2 karakter.'
    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const session = await createRoom(roomName.trim(), ownerName.trim(), selectedAvatar)
      setSession(session)
      router.push(`/room/${session.room_id}`)
    } catch (err) {
      setErrors({ general: 'Gagal membuat room. Cek koneksi internet kamu.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 bg-[var(--canvas)]">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[var(--accent)] flex items-center justify-center shadow-lg mb-4">
            <Sparkles className="w-8 h-8 text-[var(--accent-contrast)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Buat Tempat Kenangan
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xs mx-auto">
            Satu ruang untuk menyimpan setiap momen bersama sahabat-sahabat tersayang.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 shadow-sm space-y-5"
        >
          {/* General Error */}
          {errors.general && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--danger-tint)] text-[var(--danger-text)] text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errors.general}
            </div>
          )}

          {/* Room Name */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-[var(--accent-text)]" />
              Nama Tempat Kenangan *
            </label>
            <input
              type="text"
              value={roomName}
              onChange={e => { setRoomName(e.target.value); setErrors(p => ({ ...p, roomName: undefined })) }}
              placeholder="Contoh: Rumah Kita, Geng Petualang, Circle 2024"
              className={`w-full px-4 py-3 rounded-2xl bg-[var(--surface-subtle)] border text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all ${
                errors.roomName
                  ? 'border-[var(--danger)] focus:border-[var(--danger)]'
                  : 'border-[var(--border)] focus:border-[var(--accent-border)]'
              }`}
            />
            {errors.roomName && (
              <p className="mt-1 text-xs text-[var(--danger-text)] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.roomName}
              </p>
            )}
          </div>

          {/* Owner Name */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[var(--warm)]" />
              Nama Kamu *
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={e => { setOwnerName(e.target.value); setErrors(p => ({ ...p, ownerName: undefined })) }}
              placeholder="Contoh: Rian, Sarah, Daffa..."
              className={`w-full px-4 py-3 rounded-2xl bg-[var(--surface-subtle)] border text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all ${
                errors.ownerName
                  ? 'border-[var(--danger)] focus:border-[var(--danger)]'
                  : 'border-[var(--border)] focus:border-[var(--accent-border)]'
              }`}
            />
            {errors.ownerName && (
              <p className="mt-1 text-xs text-[var(--danger-text)] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.ownerName}
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
                Membuat...
              </>
            ) : (
              <>
                Buat Tempat Kenangan
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-[var(--text-muted)]">
            Sudah punya link undangan?{' '}
            <span className="text-[var(--accent-text)] font-semibold">Buka langsung dari link-nya.</span>
          </p>
        </form>

        {/* Security Note */}
        <p className="text-center text-[11px] text-[var(--text-muted)] mt-4 max-w-xs mx-auto leading-relaxed">
          🔒 Keamanan bergantung pada kerahasiaan invite link. Jangan bagikan di luar lingkaran sahabat.
        </p>
      </div>
    </main>
  )
}

