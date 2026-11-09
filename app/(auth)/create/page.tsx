'use client'

import React, { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, User, Home, ArrowRight, AlertCircle, Link as LinkIcon, X } from 'lucide-react'
import { createRoom } from '@/lib/services/rooms'
import { useSession } from '@/context/SessionContext'
import { useToast } from '@/context/ToastContext'

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
  const toast = useToast()
  const isSubmittingRef = useRef(false)

  const [roomName, setRoomName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ roomName?: string; ownerName?: string; general?: string }>({})

  // Join Link Modal State
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [pasteLinkInput, setPasteLinkInput] = useState('')
  const [pasteError, setPasteError] = useState('')

  const handleGoToLink = (e: React.FormEvent) => {
    e.preventDefault()
    setPasteError('')
    const raw = pasteLinkInput.trim()
    if (!raw) {
      setPasteError('Silakan masukkan link atau kode undangan.')
      return
    }

    const match = raw.match(/\/join\/([^\/\s?#]+)\/([^\/\s?#]+)/)
    if (match) {
      router.push(`/join/${match[1]}/${match[2]}`)
      return
    }

    const parts = raw.split('/').filter(Boolean)
    if (parts.length >= 2) {
      const token = parts[parts.length - 1]
      const roomId = parts[parts.length - 2]
      router.push(`/join/${roomId}/${token}`)
      return
    }

    setPasteError('Format link tidak dikenali. Pastikan berisi /join/ID_ROOM/TOKEN')
  }

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
    if (isSubmittingRef.current) return

    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    isSubmittingRef.current = true
    setIsLoading(true)
    setErrors({})

    try {
      const session = await createRoom(roomName.trim(), ownerName.trim(), selectedAvatar)
      setSession(session)
      router.push(`/room/${session.room_id}`)
    } catch (err) {
      console.error('Create room submission failed:', err)
      const message = err instanceof Error ? err.message : 'Gagal membuat room. Cek koneksi internet kamu.'
      setErrors({ general: message })
      toast.error(message)
    } finally {
      isSubmittingRef.current = false
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 bg-[var(--color-paper)]">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[var(--color-clay)] flex items-center justify-center shadow-lg mb-4">
            <Sparkles className="w-8 h-8 text-[var(--color-surface)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Buat Tempat Kenangan
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1 max-w-xs mx-auto">
            Satu ruang untuk menyimpan setiap momen bersama sahabat-sahabat tersayang.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border p-6 shadow-sm space-y-5"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-line)' }}
        >
          {/* General Error */}
          {errors.general && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-semibold" style={{ background: 'var(--color-danger-tint)', color: 'var(--color-error)', borderColor: 'var(--color-error)' }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errors.general}
            </div>
          )}

          {/* Room Name */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-ink-soft)] mb-1.5 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-[var(--color-clay)]" />
              Nama Tempat Kenangan *
            </label>
            <input
              type="text"
              value={roomName}
              onChange={e => { setRoomName(e.target.value); setErrors(p => ({ ...p, roomName: undefined })) }}
              placeholder="Contoh: Rumah Kita, Geng Petualang, Circle 2024"
              className={`w-full px-4 py-3 rounded-2xl text-sm outline-none transition-colors`}
              style={{
                background: 'var(--color-sunken)',
                border: errors.roomName
                  ? '1.5px solid var(--color-error)'
                  : '1.5px solid var(--color-line)',
                color: 'var(--color-ink)',
              }}
            />
            {errors.roomName && (
              <p className="mt-1 text-xs font-medium flex items-center gap-1" style={{ color: 'var(--color-error)' }}>
                <AlertCircle className="w-3 h-3" /> {errors.roomName}
              </p>
            )}
          </div>

          {/* Owner Name */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-ink-soft)] mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[var(--color-ink-soft)]" />
              Nama Kamu *
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={e => { setOwnerName(e.target.value); setErrors(p => ({ ...p, ownerName: undefined })) }}
              placeholder="Contoh: Rian, Sarah, Daffa..."
              className={`w-full px-4 py-3 rounded-2xl text-sm outline-none transition-colors`}
              style={{
                background: 'var(--color-sunken)',
                border: errors.ownerName
                  ? '1.5px solid var(--color-error)'
                  : '1.5px solid var(--color-line)',
                color: 'var(--color-ink)',
              }}
            />
            {errors.ownerName && (
              <p className="mt-1 text-xs font-medium flex items-center gap-1" style={{ color: 'var(--color-error)' }}>
                <AlertCircle className="w-3 h-3" /> {errors.ownerName}
              </p>
            )}
          </div>

          {/* Avatar Picker */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-ink-soft)] mb-2">
              Pilih Avatar
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {AVATAR_OPTIONS.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setSelectedAvatar(url)}
                  className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-colors ${
                    selectedAvatar === url
                      ? 'border-[var(--color-clay)] scale-110 shadow-md'
                      : 'border-transparent hover:border-[var(--color-line)]'
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
            className="w-full py-3.5 bg-[var(--color-clay)] hover:bg-[var(--color-clay-deep)] text-[var(--color-surface)] rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
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

          <p className="text-center text-xs text-[var(--color-ink-soft)]">
            Sudah punya link undangan?{' '}
            <button
              type="button"
              onClick={() => setShowJoinModal(true)}
              className="text-[var(--color-clay)] font-bold underline underline-offset-2 hover:opacity-80 transition-opacity cursor-pointer inline-flex items-center gap-1"
            >
              <LinkIcon className="w-3 h-3" />
              Buka lewat link undangan
            </button>
          </p>
        </form>

        {/* Security Note */}
        <p className="text-center text-[11px] text-[var(--color-ink-soft)] mt-4 max-w-xs mx-auto leading-relaxed">
          Keamanan bergantung pada kerahasiaan invite link. Jangan bagikan di luar lingkaran sahabat.
        </p>
      </div>

      {/* ── Modal Input Link Undangan ── */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)] backdrop-blur-xs animate-in fade-in">
          <div className="bg-[var(--color-white)] rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-[var(--color-line)] animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[var(--color-clay-tint)] flex items-center justify-center text-[var(--color-clay)]">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[var(--color-ink)]">
                  Buka Lewat Link Undangan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowJoinModal(false)
                  setPasteError('')
                }}
                className="w-8 h-8 rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-line)] text-[var(--color-ink-soft)] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
              Jika pasangan atau sahabatmu sudah membagikan link undangan kamar, tempel (paste) link tersebut di bawah ini:
            </p>

            <form onSubmit={handleGoToLink} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={pasteLinkInput}
                  onChange={(e) => {
                    setPasteLinkInput(e.target.value)
                    setPasteError('')
                  }}
                  placeholder="Contoh: https://our-little-place-drab.vercel.app/join/..."
                  className={`w-full px-4 py-3 rounded-2xl text-xs outline-none transition-colors`}
                  style={{
                    background: 'var(--color-sunken)',
                    border: pasteError
                      ? '1.5px solid var(--color-error)'
                      : '1.5px solid var(--color-line)',
                    color: 'var(--color-ink)',
                  }}
                />
                {pasteError && (
                  <p className="mt-1.5 text-xs font-medium flex items-center gap-1" style={{ color: 'var(--color-error)' }}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {pasteError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinModal(false)
                    setPasteError('')
                  }}
                  className="flex-1 py-2.5 rounded-2xl text-xs font-semibold transition-colors cursor-pointer hover:bg-[var(--color-sunken)]"
                  style={{ color: 'var(--color-ink-soft)' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm text-[var(--color-white)]"
                  style={{
                    background: 'var(--color-clay)',
                    border: '1px solid var(--color-clay-deep)',
                  }}
                >
                  <span>Buka Kamar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}


