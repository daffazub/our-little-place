'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Users, User, AlertCircle, ArrowRight, ShieldAlert, Smartphone, UserCheck, Sparkles } from 'lucide-react'
import { joinRoom, validateInviteToken, checkExistingDeviceMember, isMemberNameTaken } from '@/lib/auth'
import { useSession } from '@/context/SessionContext'
import type { Room, Member } from '@/types/database'

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
  const [existingMember, setExistingMember] = useState<Member | null>(null)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([])
  const [isCheckingName, setIsCheckingName] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; general?: string }>({})

  // Validate token & check device member on mount
  useEffect(() => {
    async function validate() {
      setIsValidating(true)
      try {
        const result = await validateInviteToken(params.roomId, params.token)
        if (result.valid && result.room) {
          setRoom(result.room)
          setTokenValid(true)

          // Cek apakah perangkat ini sudah terdaftar di room ini
          const existing = await checkExistingDeviceMember(params.roomId)
          if (existing) {
            setExistingMember(existing)
            setMemberName(existing.name)
            if (existing.avatar_url) {
              setSelectedAvatar(existing.avatar_url)
            }
          }
        } else {
          setTokenValid(false)
        }
      } catch {
        setTokenValid(false)
      } finally {
        setIsValidating(false)
      }
    }
    if (params.roomId && params.token) validate()
  }, [params.roomId, params.token])

  // Real-time debounced (500ms) name validation
  useEffect(() => {
    const trimmed = memberName.trim()
    if (!trimmed || trimmed.length < 2) {
      setNameSuggestions([])
      return
    }

    // Don't flag if it's the member's current existing name
    if (existingMember && trimmed.toLowerCase() === existingMember.name.trim().toLowerCase()) {
      setErrors(prev => ({ ...prev, name: undefined }))
      setNameSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      setIsCheckingName(true)
      try {
        const taken = await isMemberNameTaken(params.roomId, trimmed, existingMember?.id)
        if (taken) {
          setErrors(prev => ({
            ...prev,
            name: `Nama '${trimmed}' sudah dipakai di room ini, coba nama lain ya 😊`,
          }))
          setNameSuggestions([`${trimmed}2`, `${trimmed}_`, `${trimmed} B`, `${trimmed} ✨`])
        } else {
          setErrors(prev => ({ ...prev, name: undefined }))
          setNameSuggestions([])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsCheckingName(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [memberName, params.roomId, existingMember])

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
      const msg = err instanceof Error ? err.message : 'Gagal bergabung ke room.'
      if (msg.toLowerCase().includes('sudah digunakan') || msg.toLowerCase().includes('nama')) {
        setErrors({ name: msg })
      } else {
        setErrors({ general: msg })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Quick direct login for recognized device
  const handleDirectEnter = async () => {
    if (!existingMember) return
    setIsLoading(true)
    try {
      const session = await joinRoom(params.roomId, params.token, existingMember.name, existingMember.avatar_url || selectedAvatar)
      setSession(session)
      router.push(`/room/${params.roomId}`)
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Gagal masuk ke room.' })
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

        {/* ── Case 1: Perangkat Sudah Terhubung (Sapaan Pengenalan Sesi) ── */}
        {existingMember && !showEditProfile ? (
          <div
            className="rounded-3xl border p-7 shadow-xl text-center space-y-5 animate-fade-in-up"
            style={{
              background: '#FFFFFF',
              borderColor: 'rgba(255, 180, 162, 0.45)',
              boxShadow: '0 16px 40px -10px rgba(255, 180, 162, 0.25), 0 4px 12px rgba(0,0,0,0.03)',
            }}
          >
            {/* Avatar & Dikenali Badge */}
            <div className="relative inline-block mx-auto">
              <div
                className="w-20 h-20 rounded-3xl overflow-hidden border-2 shadow-md mx-auto"
                style={{ borderColor: 'var(--joy-accent-peach)' }}
              >
                {existingMember.avatar_url ? (
                  <img src={existingMember.avatar_url} alt={existingMember.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-lg text-[var(--joy-charcoal)] bg-[var(--joy-yellow-light)]">
                    {existingMember.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-xs border-2 border-white"
                style={{ background: 'var(--joy-accent-green)', color: '#2d6a4a' }}
                title="Perangkat Terverifikasi"
              >
                <UserCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[var(--joy-yellow-light)] text-[var(--joy-charcoal)] border border-[rgba(255,217,125,0.7)] shadow-2xs">
                <Sparkles className="w-3 h-3 text-[var(--joy-peach)]" />
                Perangkat Dikenali
              </div>
              <h2
                className="text-lg font-bold text-[var(--joy-charcoal)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Selamat Datang Kembali!
              </h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Perangkat ini sudah terhubung ke room sebagai{' '}
                <span className="font-bold text-[var(--joy-charcoal)]">"{existingMember.name}"</span>.
              </p>
            </div>

            {errors.general && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--danger-tint)] text-[var(--danger-text)] text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errors.general}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleDirectEnter}
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-97 disabled:opacity-60 cursor-pointer shadow-md hover:opacity-95"
                style={{
                  background: 'var(--gradient-plan)',
                  color: 'var(--joy-charcoal)',
                  boxShadow: '0 6px 20px rgba(255, 180, 162, 0.4)',
                }}
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Menghubungkan...
                  </>
                ) : (
                  <>
                    Masuk sebagai {existingMember.name}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowEditProfile(true)}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--joy-charcoal)] font-semibold transition-colors underline underline-offset-2 cursor-pointer"
              >
                Perbarui nama atau avatar
              </button>
            </div>
          </div>
        ) : (
          /* ── Case 2: Form Pendaftaran / Perbarui Profil ── */
          <form
            onSubmit={handleJoin}
            className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 shadow-sm space-y-5 animate-fade-in-up"
          >
            {existingMember && (
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <Smartphone className="w-4 h-4 text-[var(--joy-peach)]" />
                  <span>Perbarui profil untuk perangkat ini</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--joy-charcoal)] underline cursor-pointer"
                >
                  Batal
                </button>
              </div>
            )}

            {errors.general && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--danger-tint)] text-[var(--danger-text)] text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errors.general}
              </div>
            )}

            {/* Name with real-time validation */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[var(--warm)]" />
                  Nama Kamu <span className="text-[var(--joy-error)]">*</span>
                </span>
                {isCheckingName && (
                  <span className="text-[10px] text-[var(--text-muted)] font-normal animate-pulse">
                    Mengecek ketersediaan...
                  </span>
                )}
              </label>
              <input
                type="text"
                value={memberName}
                onChange={e => {
                  setMemberName(e.target.value)
                  if (errors.name) setErrors(p => ({ ...p, name: undefined }))
                }}
                placeholder="Contoh: Maya, David, Yoga..."
                className={`w-full px-4 py-3 rounded-2xl bg-[var(--surface-subtle)] border text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all ${
                  errors.name
                    ? 'border-[var(--joy-error)] focus:ring-2 focus:ring-[var(--joy-error)]/20'
                    : 'border-[var(--border)] focus:border-[var(--accent-border)]'
                }`}
              />
              {errors.name && (
                <div className="mt-2 space-y-1.5">
                  <p className="text-xs text-[var(--joy-error)] flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.name}
                  </p>
                  {/* Suggestion Chips */}
                  {nameSuggestions.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[10px] text-[var(--text-muted)] font-medium">Saran:</span>
                      {nameSuggestions.map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => {
                            setMemberName(sug)
                            setNameSuggestions([])
                            setErrors(prev => ({ ...prev, name: undefined }))
                          }}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--joy-yellow-light)] text-[var(--joy-charcoal)] border border-[rgba(255,217,125,0.8)] hover:scale-105 transition-all cursor-pointer shadow-2xs"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
                    className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
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
              disabled={isLoading || isCheckingName || !!errors.name}
              className="w-full py-3.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-contrast)] rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-97 disabled:opacity-60 cursor-pointer shadow-sm"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  {existingMember ? 'Menyimpan...' : 'Bergabung...'}
                </>
              ) : (
                <>
                  {existingMember ? 'Simpan & Masuk ke Room' : 'Masuk ke Room'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <p className="text-center text-[11px] text-[var(--text-muted)] mt-4 max-w-xs mx-auto leading-relaxed">
          🔒 Link ini bersifat pribadi. Tolong jangan disebar ke luar circle.
        </p>
      </div>
    </main>
  )
}
