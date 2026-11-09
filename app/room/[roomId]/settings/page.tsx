'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Settings,
  Users,
  Key,
  Copy,
  Check,
  Plus,
  Trash2,
  LogOut,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  UserMinus,
  Share2,
  User,
  Loader2,

  Save,
} from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import { doc, updateDoc, runTransaction } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import {
  getRoomMembers,
  getActiveInviteTokens,
  generateInviteToken,
  revokeInviteToken,
  removeMember,

  isSafeAvatarUrl,
  usernameKey,
} from '@/lib/services/rooms'
import type { Member, InviteToken } from '@/types'
import { useToast } from '@/context/ToastContext'
import PageHeaderCard from '@/components/ui/PageHeaderCard'

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=0f766e',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Lily&backgroundColor=b45309',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Max&backgroundColor=e11d48',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Nova&backgroundColor=65a30d',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna&backgroundColor=57534e',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Star&backgroundColor=0f766e',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aria&backgroundColor=0f766e',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Kai&backgroundColor=b45309',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe&backgroundColor=e11d48',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Finn&backgroundColor=65a30d',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Sky&backgroundColor=57534e',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Jade&backgroundColor=0f766e',
]

export default function SettingsPage() {
  const params = useParams<{ roomId: string }>()
  const router = useRouter()
  const { session, logout, isOwner, refreshSession, setSession } = useSession()
  const toast = useToast()

  const [members, setMembers] = useState<Member[]>([])
  const [tokens, setTokens] = useState<InviteToken[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null)

  // Profile Edit State
  const [myName, setMyName] = useState('')
  const [myAvatar, setMyAvatar] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')

  // Room Rename State
  const [roomName, setRoomName] = useState('')
  const [roomNameError, setRoomNameError] = useState('')

  // Modals
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null)
  const [removingMember, setRemovingMember] = useState(false)

  // Initialize values from session
  useEffect(() => {
    if (session) {
      setMyName(session.name || '')
      setMyAvatar(session.avatar_url || AVATAR_OPTIONS[0])
      if (session.room?.name) {
        setRoomName(session.room.name)
      }
    }
  }, [session])

  const loadData = async () => {
    if (!params.roomId) return
    setLoading(true)
    try {
      const [membersData, tokensData] = await Promise.all([
        getRoomMembers(params.roomId),
        getActiveInviteTokens(params.roomId),
      ])
      setMembers(membersData)
      setTokens(tokensData as InviteToken[])
    } catch {
      console.error('Failed to load settings data.')
      toast.error('Gagal memuat data pengaturan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [params.roomId])

  // ─── 1. Handle Update Profile ─────────────────────────────────────
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError('')

    const trimmed = myName.trim()
    if (!trimmed) {
      setProfileError('Nama panggilan wajib diisi.')
      return
    }
    if (trimmed.length < 2) {
      setProfileError('Nama panggilan minimal 2 karakter.')
      return
    }

    if (!session || !params.roomId) return

    setSavingProfile(true)
    try {
      const safeAvatar = isSafeAvatarUrl(myAvatar) ? myAvatar : null

      // Atomic username lock update jika nama berubah
      if (trimmed.toLowerCase() !== session.name.trim().toLowerCase()) {
        await runTransaction(db, async (tx) => {
          const newLockRef = doc(db, 'rooms', params.roomId, 'usernames', usernameKey(trimmed))
          const newLockSnap = await tx.get(newLockRef)
          if (newLockSnap.exists() && newLockSnap.data().member_id !== session.id) {
            throw new Error(`Nama '${trimmed}' sudah dipakai di room ini, gunakan nama lain ya 😊`)
          }
          const oldLockRef = doc(db, 'rooms', params.roomId, 'usernames', usernameKey(session.name))
          tx.delete(oldLockRef)
          tx.set(newLockRef, { member_id: session.id, name: trimmed, created_at: new Date().toISOString() })
          const memberRef = doc(db, 'rooms', params.roomId, 'members', session.id)
          tx.update(memberRef, {
            name: trimmed,
            ...(safeAvatar ? { avatar_url: safeAvatar } : {}),
          })
        })
      } else {
        const memberRef = doc(db, 'rooms', params.roomId, 'members', session.id)
        await updateDoc(memberRef, {
          name: trimmed,
          ...(safeAvatar ? { avatar_url: safeAvatar } : {}),
        })
      }

      // Update local session
      setSession({
        ...session,
        name: trimmed,
        avatar_url: safeAvatar || session.avatar_url,
      })

      await refreshSession()
      await loadData()
      toast.success('Profil kamu berhasil diperbarui!')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui profil.'
      setProfileError(msg)
      toast.error(msg)
    } finally {
      setSavingProfile(false)
    }
  }

  // ─── 2. Handle Update Room Name ───────────────────────────────────
  const handleUpdateRoomName = async (e: React.FormEvent) => {
    e.preventDefault()
    setRoomNameError('')

    const trimmed = roomName.trim()
    if (!trimmed) {
      setRoomNameError('Nama ruang kenangan wajib diisi.')
      return
    }
    if (trimmed.length < 2) {
      setRoomNameError('Nama ruang kenangan minimal 2 karakter.')
      return
    }
    if (!isOwner || !params.roomId) return

    setActionLoading(true)
    try {
      const roomRef = doc(db, 'rooms', params.roomId)
      await updateDoc(roomRef, { name: trimmed })

      await refreshSession()
      toast.success('Nama ruang kenangan berhasil diperbarui!')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui nama room.'
      setRoomNameError(msg)
      toast.error(msg)
    } finally {
      setActionLoading(false)
    }
  }

  // ─── 3. Handle Invite Tokens ──────────────────────────────────────
  const handleCreateNewToken = async () => {
    if (!session || !isOwner || !params.roomId) return
    setActionLoading(true)
    try {
      await generateInviteToken(params.roomId, session.id)
      await loadData()
      toast.success('Link undangan baru berhasil dibuat!')
    } catch {
      toast.error('Gagal membuat link undangan baru.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRevokeToken = async (tokenId: string) => {
    if (!isOwner || !params.roomId) return
    try {
      await revokeInviteToken(params.roomId, tokenId)
      await loadData()
      toast.warning('Link undangan berhasil dinonaktifkan.')
    } catch {
      toast.error('Gagal menonaktifkan token.')
    }
  }

  const handleCopyLink = async (token: InviteToken) => {
    const inviteUrl = `${window.location.origin}/join/${params.roomId}/${token.token}`
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(inviteUrl)
      setCopiedTokenId(token.id)
      setTimeout(() => setCopiedTokenId(null), 2500)
      toast.success('Link undangan berhasil disalin!')
    }
  }

  const handleShareLink = async (token: InviteToken) => {
    const inviteUrl = `${window.location.origin}/join/${params.roomId}/${token.token}`
    const shareData = {
      title: session?.room?.name || 'Our Little Place',
      text: `Ayo bergabung ke ruang kenangan "${session?.room?.name || 'Our Little Place'}"!`,
      url: inviteUrl,
    }

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
        return
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
      }
    }

    // Fallback to clipboard
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(inviteUrl)
      setCopiedTokenId(token.id)
      setTimeout(() => setCopiedTokenId(null), 2500)
      toast.success('Link undangan berhasil disalin!')
    }
  }

  // ─── 4. Handle Remove Member ──────────────────────────────────────
  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove || !params.roomId) return
    setRemovingMember(true)
    const removedName = memberToRemove.name
    try {
      await removeMember(params.roomId, memberToRemove.id)
      setMemberToRemove(null)
      await loadData()
      toast.success(`${removedName} telah dikeluarkan dari room.`)
    } catch {
      toast.error('Gagal mengeluarkan anggota.')
    } finally {
      setRemovingMember(false)
    }
  }

  const isProfileChanged =
    session && (myName.trim() !== session.name || myAvatar !== session.avatar_url)

  const isRoomNameChanged =
    session?.room && roomName.trim() !== session.room.name

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* ── 1. Page Header Card ── */}
      <PageHeaderCard
        badge={{
          text: 'Pengaturan & Akses',
          icon: Settings,
          bg: 'var(--color-dusk)',
          textColor: 'var(--color-ink)',
          borderColor: 'var(--color-line)',
        }}
        title="⚙️ Pengaturan & Anggota"
        description="Kelola profil pribadimu, nama tempat kenangan, anggota yang terhubung, dan link undangan."
        cta={
          isOwner
            ? {
                label: 'Buat Link Undangan',
                icon: Plus,
                onClick: handleCreateNewToken,
                disabled: actionLoading,
              }
            : undefined
        }
      />

      {/* ── 2. Profil Saya (Personal Profile Card) ── */}
      <section
        className="rounded-2xl overflow-hidden shadow-xs border"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-line)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="h-1.5" style={{ background: 'var(--color-clay-tint)' }} />
        <div className="p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2
                className="text-base font-bold flex items-center gap-2"
                style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}
              >
                <User className="w-4 h-4" style={{ color: 'var(--color-clay)' }} />
                Profil Saya
              </h2>
              <p className="text-xs text-[var(--color-ink-soft)]">
                Sesuaikan nama panggilan dan avatar karaktermu yang tampil kepada sahabat di room ini.
              </p>
            </div>

            {session && (
              <span
                className="px-3 py-1 rounded-full text-[11px] font-bold shrink-0 border"
                style={
                  isOwner
                    ? {
                        background: 'var(--color-clay-tint)',
                        color: 'var(--color-clay-contrast)',
                        borderColor: 'var(--color-clay)',
                      }
                    : {
                        background: 'var(--color-surface)',
                        color: 'var(--color-ink-soft)',
                        borderColor: 'var(--color-line)',
                      }
                }
              >
                {isOwner ? '👑 Pemilik Room' : '🌸 Sahabat'}
              </span>
            )}
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5 pt-1">
            {/* Current Avatar & Selector */}
            <div className="space-y-2.5">
              <label className="block text-sm font-semibold text-[var(--color-ink-soft)]">
                Pilih Karakter Avatar <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>

              <div className="flex items-center gap-4 flex-wrap">
                {/* Large Preview */}
                <div
                  className="w-16 h-16 rounded-3xl overflow-hidden shrink-0 border-2 shadow-sm p-0.5"
                  style={{
                    borderColor: 'var(--color-clay-tint)',
                    background: 'var(--color-clay-tint)',
                  }}
                >
                  {myAvatar ? (
                    <img src={myAvatar} alt={myName} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-sm text-[var(--color-ink)]">
                      {myName ? myName.slice(0, 2).toUpperCase() : 'ME'}
                    </div>
                  )}
                </div>

                {/* Avatar Grid Selection */}
                <div className="flex-1 min-w-[240px]">
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                    {AVATAR_OPTIONS.map((avatar, idx) => {
                      const isSelected = myAvatar === avatar
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setMyAvatar(avatar)
                            setProfileError('')
                          }}
                          className={`relative aspect-square rounded-2xl p-1 transition-colors cursor-pointer border ${
                            isSelected
                              ? 'scale-110 shadow-md border-[var(--color-clay)] bg-[var(--color-white)] ring-2 ring-[var(--color-clay)]/40'
                              : 'border-[var(--color-line)] bg-[var(--color-sunken)] hover:scale-105 hover:border-[var(--color-clay-tint)]'
                          }`}
                        >
                          <img
                            src={avatar}
                            alt={`Avatar ${idx + 1}`}
                            className="w-full h-full object-cover rounded-xl"
                          />
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-clay)] text-[var(--color-white)] flex items-center justify-center shadow-xs">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-[var(--color-ink-soft)]">
                Nama Panggilan Kamu <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="flex-1">
                  <input
                    type="text"
                    value={myName}
                    onChange={e => {
                      setMyName(e.target.value)
                      if (profileError) setProfileError('')
                    }}
                    placeholder="Masukkan nama panggilanmu..."
                    maxLength={30}
                    className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm outline-none transition-colors"
                    style={{
                      background: 'var(--color-sunken)',
                      border: `1.5px solid ${profileError ? 'var(--color-error)' : 'var(--color-line)'}`,
                      color: 'var(--color-ink)',
                    }}
                  />
                  {profileError && (
                    <p
                      className="mt-1.5 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in"
                      style={{ color: 'var(--color-error)' }}
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{profileError}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={savingProfile || !myName.trim() || !isProfileChanged}
                  className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                  style={{
                    background: 'var(--color-clay)',
                    color: 'var(--color-white)',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Profil</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ── 3. Informasi Tempat Kenangan (Room Info & Rename) ── */}
      <section
        className="rounded-2xl overflow-hidden shadow-xs border"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-line)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="h-1.5" style={{ background: 'var(--color-clay-tint)' }} />
        <div className="p-6 sm:p-7 space-y-4">
          <div className="space-y-1">
            <h2
              className="text-base font-bold flex items-center gap-2"
              style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}
            >
              <ShieldCheck className="w-4 h-4" style={{ color: 'var(--color-clay)' }} />
              Informasi Tempat Kenangan
            </h2>
            <p className="text-xs text-[var(--color-ink-soft)]">
              Nama ruang bersama yang menjadi rumah bagi seluruh kenangan kita.
            </p>
          </div>

          {isOwner ? (
            <form onSubmit={handleUpdateRoomName} className="space-y-2 pt-1">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-[var(--color-ink-soft)]">
                  Nama Ruang Kenangan <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={roomName}
                      onChange={e => {
                        setRoomName(e.target.value)
                        if (roomNameError) setRoomNameError('')
                      }}
                      placeholder="Contoh: Tempat Pulang Kita, Cerita Sahabat..."
                      maxLength={50}
                      className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm outline-none transition-colors"
                      style={{
                        background: 'var(--color-sunken)',
                        border: `1.5px solid ${roomNameError ? 'var(--color-error)' : 'var(--color-line)'}`,
                        color: 'var(--color-ink)',
                      }}
                    />
                    {roomNameError && (
                      <p
                        className="mt-1.5 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in"
                        style={{ color: 'var(--color-error)' }}
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{roomNameError}</span>
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={actionLoading || !roomName.trim() || !isRoomNameChanged}
                    className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                    style={{
                      background: 'var(--color-clay)',
                      color: 'var(--color-white)',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="p-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-sunken)] space-y-1">
              <p className="text-xs text-[var(--color-ink-soft)]">Nama Tempat:</p>
              <p className="text-base font-bold text-[var(--color-ink)]">{roomName}</p>
              <p className="text-[11px] text-[var(--color-ink-soft)] pt-1">
                Hanya pembuat room yang dapat mengubah nama tempat kenangan.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── 4. Anggota Terhubung ── */}
      <section
        className="rounded-2xl overflow-hidden shadow-xs border"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-line)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="h-1.5" style={{ background: 'var(--color-sage-tint)' }} />
        <div className="p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-base font-bold flex items-center gap-2"
                style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}
              >
                <Users className="w-4 h-4" style={{ color: 'var(--color-clay)' }} />
                Anggota Terhubung ({members.length})
              </h2>
              <p className="text-xs text-[var(--color-ink-soft)] mt-0.5">
                Sahabat yang memiliki akses ke ruang kenangan ini.
              </p>
            </div>

            <button
              onClick={loadData}
              title="Muat ulang daftar anggota"
              className="p-2 rounded-xl transition-colors hover:bg-[var(--color-line-soft)] text-[var(--color-ink-soft)] cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-2.5 pt-2">
              <div className="h-14 skeleton rounded-2xl" />
              <div className="h-14 skeleton rounded-2xl" />
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line)] pt-1">
              {members.map(member => {
                const isMe = member.id === session?.id
                return (
                  <div
                    key={member.id}
                    className="py-3.5 flex items-center justify-between gap-3 transition-colors rounded-2xl px-2 hover:bg-[var(--color-sunken)]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-11 h-11 rounded-2xl overflow-hidden shrink-0 border border-[var(--color-line)] shadow-xs"
                        style={{ background: 'var(--color-clay-tint)' }}
                      >
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-[var(--color-ink)]">
                            {member.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold truncate text-[var(--color-ink)] flex items-center gap-1.5">
                          <span>{member.name}</span>
                          {isMe && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{
                                background: 'var(--color-clay-tint)',
                                color: 'var(--color-clay-contrast)',
                              }}
                            >
                              Kamu
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-[var(--color-ink-soft)]">
                          Bergabung sejak{' '}
                          {member.joined_at
                            ? new Date(member.joined_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold border"
                        style={
                          member.role === 'owner'
                            ? {
                                background: 'var(--color-clay-tint)',
                                color: 'var(--color-clay-contrast)',
                                borderColor: 'var(--color-clay)',
                              }
                            : {
                                background: 'var(--color-sunken)',
                                color: 'var(--color-ink-soft)',
                                borderColor: 'var(--color-line)',
                              }
                        }
                      >
                        {member.role === 'owner' ? '👑 Pemilik' : '🌸 Sahabat'}
                      </span>

                      {/* Owner kick button */}
                      {isOwner && member.role !== 'owner' && (
                        <button
                          type="button"
                          onClick={() => setMemberToRemove(member)}
                          title={`Keluarkan ${member.name}`}
                          className="p-2 rounded-xl text-[var(--color-error)] hover:bg-[var(--color-danger-tint)] transition-colors cursor-pointer"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── 5. Link Undangan Aktif ── */}
      <section
        className="rounded-2xl overflow-hidden shadow-xs border"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-line)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="h-1.5" style={{ background: 'var(--color-honey)' }} />
        <div className="p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2
                className="text-base font-bold flex items-center gap-2"
                style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}
              >
                <Key className="w-4 h-4" style={{ color: 'var(--color-honey)' }} />
                Link Undangan Aktif
              </h2>
              <p className="text-xs text-[var(--color-ink-soft)]">
                Bagikan link ini kepada sahabat yang ingin kamu ajak masuk ke ruang kenangan ini.
              </p>
            </div>

            {isOwner && (
              <button
                onClick={handleCreateNewToken}
                disabled={actionLoading}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5py-2 rounded-2xl text-xs font-bold transition-colors hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs"
                style={{ background: 'var(--color-clay)', color: 'var(--color-white)' }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Link Baru</span>
              </button>
            )}
          </div>

          {tokens.length === 0 ? (
            <div
              className="p-6 rounded-2xl border-2 border-dashed text-center text-xs space-y-2"
              style={{
                borderColor: 'var(--color-line)',
                color: 'var(--color-ink-soft)',
                background: 'var(--color-sunken)',
              }}
            >
              <Key className="w-6 h-6 mx-auto text-[var(--color-ink-soft)] opacity-50" />
              <p>Tidak ada link undangan aktif saat ini.</p>
              {isOwner && (
                <button
                  type="button"
                  onClick={handleCreateNewToken}
                  disabled={actionLoading}
                  className="mt-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                  style={{ background: 'var(--color-clay)', color: 'var(--color-white)' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Buat Link Pertama
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {tokens.map(t => {
                const inviteUrl =
                  typeof window !== 'undefined'
                    ? `${window.location.origin}/join/${params.roomId}/${t.token}`
                    : t.token

                return (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 border shadow-2xs"
                    style={{
                      background: 'rgba(220, 230, 236, 0.3)',
                      borderColor: 'var(--color-line)',
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-xs font-mono font-semibold truncate select-all"
                        style={{ color: 'var(--color-ink)' }}
                      >
                        {inviteUrl}
                      </p>
                      <p className="text-[10px] mt-0.5 text-[var(--color-ink-soft)]">
                        Dibuat pada{' '}
                        {new Date(t.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-1 md:pt-0">
                      {/* Native Share Button */}
                      <button
                        type="button"
                        onClick={() => handleShareLink(t)}
                        title="Bagikan via aplikasi..."
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border hover:bg-[var(--color-white)] shadow-2xs"
                        style={{
                          background: 'var(--color-surface)',
                          borderColor: 'var(--color-line)',
                          color: 'var(--color-ink)',
                        }}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Bagikan</span>
                      </button>

                      {/* Copy Link Button */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(t)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border hover:bg-[var(--color-white)] shadow-2xs"
                        style={{
                          background: 'var(--color-surface)',
                          borderColor: 'var(--color-line)',
                          color: 'var(--color-ink)',
                        }}
                      >
                        {copiedTokenId === t.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[var(--color-sage-deep)]" />
                            <span style={{ color: 'var(--color-sage-deep)' }}>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin Link</span>
                          </>
                        )}
                      </button>

                      {/* Revoke Button (Owner only) */}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleRevokeToken(t.id)}
                          title="Nonaktifkan link ini"
                          className="p-2 rounded-xl transition-colors hover:bg-[var(--color-danger-tint)] text-[var(--color-error)] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── 6. Keluar dari Room ── */}
      <section
        className="rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-error-line)',
        }}
      >
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold" style={{ color: 'var(--color-error)' }}>
            Keluar dari Ruang Kenangan
          </h3>
          <p className="text-xs text-[var(--color-ink-soft)]">
            Menghapus sesi perangkat ini dari room. Kamu butuh tautan undangan untuk masuk kembali.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="px-5 py-2.5 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shrink-0 hover:opacity-90 cursor-pointer shadow-2xs"
          style={{ background: 'rgba(179, 38, 30, 0.08)', color: 'var(--color-error)' }}
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar</span>
        </button>
      </section>

      {/* ── Modal Konfirmasi Keluar / Logout ── */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)] backdrop-blur-xs animate-in fade-in"
          onClick={e => {
            if (e.target === e.currentTarget) setShowLogoutModal(false)
          }}
        >
          <div
            className="rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-center animate-fade-in-up border"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-line)',
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-xs"
              style={{ background: 'var(--color-clay-tint)', color: 'var(--color-clay)' }}
            >
              <LogOut className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3
                className="text-base font-bold"
                style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}
              >
                Keluar dari Ruang Kenangan?
              </h3>
              <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
                Sesi perangkat ini akan dihapus dari room. Kamu butuh tautan undangan untuk masuk kembali.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-[var(--color-ink-soft)] bg-[var(--color-sunken)] border border-[var(--color-line)] transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false)
                  logout()
                  router.push('/create')
                }}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-[var(--color-white)] transition-colors hover:opacity-90 shadow-sm cursor-pointer"
                style={{
                  background: 'var(--color-clay)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Konfirmasi Keluarkan Anggota ── */}
      {memberToRemove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)] backdrop-blur-xs animate-in fade-in"
          onClick={e => {
            if (e.target === e.currentTarget && !removingMember) setMemberToRemove(null)
          }}
        >
          <div
            className="rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-center animate-fade-in-up border"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-line)',
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-xs"
              style={{ background: 'var(--color-clay-tint)', color: 'var(--color-clay)' }}
            >
              <UserMinus className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3
                className="text-base font-bold"
                style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}
              >
                Keluarkan {memberToRemove.name} dari room ini?
              </h3>
              <p className="text-xs text-[var(--color-ink-soft)] leading-relaxed">
                {memberToRemove.name} tidak akan bisa mengakses room ini lagi kecuali diundang ulang.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                disabled={removingMember}
                onClick={() => setMemberToRemove(null)}
                className="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-[var(--color-ink-soft)] bg-[var(--color-sunken)] border border-[var(--color-line)] transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={removingMember}
                onClick={handleConfirmRemoveMember}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-[var(--color-white)] transition-colors hover:opacity-90 shadow-sm cursor-pointer disabled:opacity-50"
                style={{
                  background: 'var(--color-clay)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                {removingMember ? 'Mengeluarkan...' : 'Ya, Keluarkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


