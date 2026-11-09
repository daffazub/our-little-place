'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Users, User, AlertCircle, ArrowRight, ShieldAlert, Smartphone, UserCheck, Sparkles } from 'lucide-react'
import { joinRoom, validateInviteToken, checkExistingDeviceMember, isMemberNameTaken } from '@/lib/services/rooms'
import { useSession } from '@/context/SessionContext'
import type { Room, Member } from '@/types'
import { Button as DSButton } from '@/components/ui/Button'
import { Input as DSInput } from '@/components/ui/Input'

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
            name: `Nama '${trimmed}' sudah dipakai di room ini, gunakan nama lain`,
          }))
          setNameSuggestions([`${trimmed}2`, `${trimmed}_`, `${trimmed} B`, `${trimmed} baru`])
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
      <main className="min-h-dvh flex items-center justify-center p-4 bg-[var(--color-paper)]">
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
      <main className="min-h-dvh flex items-center justify-center p-4 bg-[var(--color-paper)]">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[var(--color-error)]/10 flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-[var(--color-error)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-ink)]">Link Tidak Valid</h2>
          <p className="text-sm text-[var(--color-ink-soft)] mt-2">
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
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[var(--color-clay)] flex items-center justify-center shadow-lg mb-4">
            <Users className="w-8 h-8 text-[var(--color-surface)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)]">
            Bergabung ke{' '}
            <span className="text-[var(--color-clay)]">{room?.name}</span>
          </h1>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1 max-w-xs mx-auto">
            Kamu diundang untuk menjadi bagian dari ruang kenangan ini.
          </p>
        </div>

        {/* ── Case 1: Perangkat Sudah Terhubung (Sapaan Pengenalan Sesi) ── */}
        {existingMember && !showEditProfile ? (
          <div
            className="rounded-3xl border p-7 shadow-xl text-center space-y-5 animate-fade-in-up"
            style={{
              background: 'var(--color-white)',
              borderColor: 'rgba(255, 180, 162, 0.45)',
              boxShadow: '0 16px 40px -10px rgba(255, 180, 162, 0.25), 0 4px 12px rgba(0,0,0,0.03)',
            }}
          >
            {/* Avatar & Dikenali Badge */}
            <div className="relative inline-block mx-auto">
              <div
                className="w-20 h-20 rounded-3xl overflow-hidden border-2 shadow-md mx-auto"
                style={{ borderColor: 'var(--color-line)' }}
              >
                {existingMember.avatar_url ? (
                  <img src={existingMember.avatar_url} alt={existingMember.name} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center font-bold text-lg"
                    style={{ color: 'var(--color-ink)', background: 'var(--color-sunken)' }}
                  >
                    {existingMember.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-xs border-2 border-white"
                style={{ background: 'var(--color-sage)', color: 'var(--color-white)' }}
                title="Perangkat Terverifikasi"
              >
                <UserCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold"
                style={{
                  background: 'var(--color-honey)',
                  color: 'var(--color-ink)',
                  borderColor: 'var(--color-honey-line)',
                }}
              >
                <Sparkles className="w-3 h-3 text-[var(--color-clay)]" />
                Perangkat Dikenali
              </div>
              <h2
                className="text-lg font-bold text-[var(--color-ink)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Selamat Datang Kembali!
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-ink-soft)' }}>
                Perangkat ini sudah terhubung ke room sebagai{' '}
                <span className="font-bold text-[var(--color-ink)]">&ldquo;{existingMember.name}&rdquo;</span>.
              </p>
            </div>

            {errors.general && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-error)]/10 text-[var(--color-error)] text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errors.general}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <DSButton
                type="button"
                onClick={handleDirectEnter}
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer shadow-md hover:opacity-95"
                style={{
                  background: 'var(--color-clay)',
                  color: 'var(--color-white)',
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
              </DSButton>

              <button
                type="button"
                onClick={() => setShowEditProfile(true)}
                className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] font-semibold transition-colors underline underline-offset-2 cursor-pointer"
              >
                Perbarui nama atau avatar
              </button>
            </div>
          </div>
        ) : (
          /* ── Case 2: Form Pendaftaran / Perbarui Profil ── */
          <form
            onSubmit={handleJoin}
            className="bg-[var(--color-surface)] rounded-3xl border border-[var(--color-line)] p-6 shadow-sm space-y-5 animate-fade-in-up"
          >
            {existingMember && (
              <div className="flex items-center justify-between pb-2 border-b border-[var(--color-line)]">
                <div className="flex items-center gap-2 text-xs text-[var(--color-ink-soft)]">
                  <Smartphone className="w-4 h-4 text-[var(--color-clay)]" />
                  <span>Perbarui profil untuk perangkat ini</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="text-xs font-bold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] underline cursor-pointer"
                >
                  Batal
                </button>
              </div>
            )}

            {errors.general && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-error)]/10 text-[var(--color-error)] text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errors.general}
              </div>
            )}

            {/* Name with real-time validation */}
            <div>
              <label className="block text-sm font-semibold text-[var(--color-ink-soft)] mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[var(--color-clay)]" />
                  Nama Kamu <span className="text-[var(--color-error)]">*</span>
                </span>
                {isCheckingName && (
                  <span className="text-[10px] text-[var(--color-ink-soft)] font-normal animate-pulse">
                    Mengecek ketersediaan...
                  </span>
                )}
              </label>
              <DSInput
                type="text"
                value={memberName}
                onChange={e => {
                  setMemberName(e.target.value)
                  if (errors.name) setErrors(p => ({ ...p, name: undefined }))
                }}
                placeholder="Contoh: Maya, David, Yoga..."
                className={`w-full px-4 py-3 rounded-2xl bg-[var(--color-sunken)] border text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] outline-none transition-colors ${
                  errors.name
                    ? 'border-[var(--color-error)] focus:ring-2 focus:ring-[var(--color-error)]/20'
                    : 'border-[var(--color-line)] focus:border-[var(--color-clay)]'
                }`}
              />
              {errors.name && (
                <div className="mt-2 space-y-1.5">
                  <p className="text-xs text-[var(--color-error)] flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.name}
                  </p>
                  {/* Suggestion Chips */}
                  {nameSuggestions.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[10px] text-[var(--color-ink-soft)] font-medium">Saran:</span>
                      {nameSuggestions.map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => {
                            setMemberName(sug)
                            setNameSuggestions([])
                            setErrors(prev => ({ ...prev, name: undefined }))
                          }}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--color-honey)] text-[var(--color-ink)] border border-[var(--color-honey-line)] transition-colors cursor-pointer shadow-2xs"
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
              <label className="block text-sm font-semibold text-[var(--color-ink-soft)] mb-2">
                Pilih Avatar
              </label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {AVATAR_OPTIONS.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setSelectedAvatar(url)}
                    className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-colors cursor-pointer ${
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
              disabled={isLoading || isCheckingName || !!errors.name}
              className="w-full py-3.5 bg-[var(--color-clay)] hover:bg-[var(--color-clay-deep)] text-[var(--color-surface)] rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer shadow-sm"
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

        <p className="text-center text-[11px] text-[var(--color-ink-soft)] mt-4 max-w-xs mx-auto leading-relaxed">
          Link ini bersifat pribadi. Tolong jangan disebar ke luar circle.
        </p>
      </div>
    </main>
  )
}

