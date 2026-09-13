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
  Sparkles,
  Save,
} from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import {
  getRoomMembers,
  getActiveInviteTokens,
  generateInviteToken,
  revokeInviteToken,
  removeMember,
  isMemberNameTaken,
} from '@/lib/auth'
import type { Member, InviteToken } from '@/types/database'
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
    } catch (err) {
      console.error('Failed to load settings data:', err)
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
      // Validate uniqueness if changed
      if (trimmed.toLowerCase() !== session.name.trim().toLowerCase()) {
        const taken = await isMemberNameTaken(params.roomId, trimmed, session.id)
        if (taken) {
          setProfileError(`Nama '${trimmed}' sudah dipakai di room ini, gunakan nama lain ya 😊`)
          setSavingProfile(false)
          return
        }
      }

      // Update Firestore
      const memberRef = doc(db, 'rooms', params.roomId, 'members', session.id)
      await updateDoc(memberRef, {
        name: trimmed,
        avatar_url: myAvatar,
      })

      // Update local session
      setSession({
        ...session,
        name: trimmed,
        avatar_url: myAvatar,
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
          bg: 'var(--joy-accent-blue)',
          textColor: '#075985',
          borderColor: 'rgba(207, 232, 243, 0.9)',
        }}
        title="⚙️ Pengaturan & Anggota"
        description="Kelola profil pribadimu, nama tempat kenangan, anggota yang terhubung, dan link undangan."
        cta={
          isOwner
            ? {
                label: 'Buat Link Undangan',
                icon: Plus,
                onClick: handleCreateNewToken,
                gradient: 'var(--gradient-plan)',
                textColor: 'var(--joy-charcoal)',
                shadowColor: '0 6px 20px rgba(255, 217, 125, 0.35)',
                disabled: actionLoading,
              }
            : undefined
        }
      />

      {/* ── 2. Profil Saya (Personal Profile Card) ── */}
      <section
        className="rounded-3xl overflow-hidden shadow-xs border transition-all"
        style={{
          background: 'var(--surface)',
          borderColor: 'rgba(232, 232, 230, 0.85)',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div className="h-1.5" style={{ background: 'var(--gradient-hero)' }} />
        <div className="p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2
                className="text-base font-bold flex items-center gap-2"
                style={{ color: 'var(--joy-charcoal)', fontFamily: 'var(--font-heading)' }}
              >
                <User className="w-4 h-4 text-[#FF8C69]" />
                Profil Saya
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Sesuaikan nama panggilan dan avatar karaktermu yang tampil kepada sahabat di room ini.
              </p>
            </div>

            {session && (
              <span
                className="px-3 py-1 rounded-full text-[11px] font-bold shrink-0 border"
                style={
                  isOwner
                    ? {
                        background: 'var(--joy-yellow-light)',
                        color: '#78350f',
                        borderColor: 'rgba(255, 217, 125, 0.6)',
                      }
                    : {
                        background: 'var(--surface-elevated)',
                        color: 'var(--text-secondary)',
                        borderColor: 'var(--border)',
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
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Pilih Karakter Avatar <span style={{ color: 'var(--joy-error)' }}>*</span>
              </label>

              <div className="flex items-center gap-4 flex-wrap">
                {/* Large Preview */}
                <div
                  className="w-16 h-16 rounded-3xl overflow-hidden shrink-0 border-2 shadow-sm p-0.5"
                  style={{
                    borderColor: 'var(--joy-accent-peach)',
                    background: 'var(--joy-yellow-light)',
                  }}
                >
                  {myAvatar ? (
                    <img src={myAvatar} alt={myName} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-sm text-[var(--joy-charcoal)]">
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
                          className={`relative aspect-square rounded-2xl p-1 transition-all cursor-pointer border ${
                            isSelected
                              ? 'scale-110 shadow-md border-[#FF8C69] bg-white ring-2 ring-[#FF8C69]/40'
                              : 'border-[var(--border)] bg-[var(--surface-subtle)] hover:scale-105 hover:border-[var(--joy-accent-peach)]'
                          }`}
                        >
                          <img
                            src={avatar}
                            alt={`Avatar ${idx + 1}`}
                            className="w-full h-full object-cover rounded-xl"
                          />
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF8C69] text-white flex items-center justify-center shadow-xs">
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
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Nama Panggilan Kamu <span style={{ color: 'var(--joy-error)' }}>*</span>
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
                    className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm outline-none transition-all"
                    style={{
                      background: 'var(--surface-subtle)',
                      border: `1.5px solid ${profileError ? 'var(--joy-error)' : 'var(--border)'}`,
                      color: 'var(--text-primary)',
                    }}
                  />
                  {profileError && (
                    <p
                      className="mt-1.5 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in"
                      style={{ color: 'var(--joy-error)' }}
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{profileError}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={savingProfile || !myName.trim() || !isProfileChanged}
                  className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                  style={{
                    background: 'var(--gradient-hero)',
                    color: 'var(--joy-charcoal)',
                    boxShadow: '0 4px 14px rgba(255, 180, 162, 0.35)',
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
        className="rounded-3xl overflow-hidden shadow-xs border transition-all"
        style={{
          background: 'var(--surface)',
          borderColor: 'rgba(232, 232, 230, 0.85)',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div className="h-1.5" style={{ background: 'var(--gradient-story)' }} />
        <div className="p-6 sm:p-7 space-y-4">
          <div className="space-y-1">
            <h2
              className="text-base font-bold flex items-center gap-2"
              style={{ color: 'var(--joy-charcoal)', fontFamily: 'var(--font-heading)' }}
            >
              <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
              Informasi Tempat Kenangan
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Nama ruang bersama yang menjadi rumah bagi seluruh kenangan kita.
            </p>
          </div>

          {isOwner ? (
            <form onSubmit={handleUpdateRoomName} className="space-y-2 pt-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[var(--text-secondary)]">
                  Nama Ruang Kenangan <span style={{ color: 'var(--joy-error)' }}>*</span>
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
                      className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm outline-none transition-all"
                      style={{
                        background: 'var(--surface-subtle)',
                        border: `1.5px solid ${roomNameError ? 'var(--joy-error)' : 'var(--border)'}`,
                        color: 'var(--text-primary)',
                      }}
                    />
                    {roomNameError && (
                      <p
                        className="mt-1.5 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in"
                        style={{ color: 'var(--joy-error)' }}
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{roomNameError}</span>
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={actionLoading || !roomName.trim() || !isRoomNameChanged}
                    className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                    style={{
                      background: 'var(--gradient-story)',
                      color: 'var(--joy-charcoal)',
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
            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] space-y-1">
              <p className="text-xs text-[var(--text-secondary)]">Nama Tempat:</p>
              <p className="text-base font-bold text-[var(--text-primary)]">{roomName}</p>
              <p className="text-[11px] text-[var(--text-muted)] pt-1">
                🔒 Hanya pembuat room yang dapat mengubah nama tempat kenangan.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── 4. Anggota Terhubung ── */}
      <section
        className="rounded-3xl overflow-hidden shadow-xs border transition-all"
        style={{
          background: 'var(--surface)',
          borderColor: 'rgba(232, 232, 230, 0.85)',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div className="h-1.5" style={{ background: 'var(--gradient-memory)' }} />
        <div className="p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-base font-bold flex items-center gap-2"
                style={{ color: 'var(--joy-charcoal)', fontFamily: 'var(--font-heading)' }}
              >
                <Users className="w-4 h-4 text-[var(--joy-peach)]" />
                Anggota Terhubung ({members.length})
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Sahabat yang memiliki akses ke ruang kenangan ini.
              </p>
            </div>

            <button
              onClick={loadData}
              title="Muat ulang daftar anggota"
              className="p-2 rounded-xl transition-colors hover:bg-black/5 text-[var(--text-muted)] cursor-pointer"
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
            <div className="divide-y divide-[var(--border)] pt-1">
              {members.map(member => {
                const isMe = member.id === session?.id
                return (
                  <div
                    key={member.id}
                    className="py-3.5 flex items-center justify-between gap-3 transition-colors rounded-2xl px-2 hover:bg-[var(--surface-subtle)]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-11 h-11 rounded-2xl overflow-hidden shrink-0 border border-[var(--border)] shadow-xs"
                        style={{ background: 'var(--joy-yellow-light)' }}
                      >
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-[var(--joy-charcoal)]">
                            {member.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold truncate text-[var(--text-primary)] flex items-center gap-1.5">
                          <span>{member.name}</span>
                          {isMe && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{
                                background: 'rgba(255, 180, 162, 0.25)',
                                color: '#b45309',
                              }}
                            >
                              Kamu
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)]">
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
                                background: 'var(--joy-yellow-light)',
                                color: '#78350f',
                                borderColor: 'rgba(255, 217, 125, 0.5)',
                              }
                            : {
                                background: 'var(--surface-elevated)',
                                color: 'var(--text-secondary)',
                                borderColor: 'var(--border)',
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
                          className="p-2 rounded-xl text-[var(--danger)] hover:bg-red-50 transition-colors cursor-pointer"
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
        className="rounded-3xl overflow-hidden shadow-xs border transition-all"
        style={{
          background: 'var(--surface)',
          borderColor: 'rgba(232, 232, 230, 0.85)',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div className="h-1.5" style={{ background: 'var(--gradient-plan)' }} />
        <div className="p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2
                className="text-base font-bold flex items-center gap-2"
                style={{ color: 'var(--joy-charcoal)', fontFamily: 'var(--font-heading)' }}
              >
                <Key className="w-4 h-4 text-[var(--joy-yellow)]" />
                Link Undangan Aktif
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Bagikan link ini kepada sahabat yang ingin kamu ajak masuk ke ruang kenangan ini.
              </p>
            </div>

            {isOwner && (
              <button
                onClick={handleCreateNewToken}
                disabled={actionLoading}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs"
                style={{ background: 'var(--gradient-plan)', color: 'var(--joy-charcoal)' }}
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
                borderColor: 'var(--border)',
                color: 'var(--text-muted)',
                background: 'var(--surface-subtle)',
              }}
            >
              <Key className="w-6 h-6 mx-auto text-[var(--text-muted)] opacity-50" />
              <p>Tidak ada link undangan aktif saat ini.</p>
              {isOwner && (
                <button
                  type="button"
                  onClick={handleCreateNewToken}
                  disabled={actionLoading}
                  className="mt-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                  style={{ background: 'var(--gradient-plan)', color: 'var(--joy-charcoal)' }}
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
                      background: 'rgba(207, 232, 243, 0.25)',
                      borderColor: 'rgba(207, 232, 243, 0.85)',
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-xs font-mono font-semibold truncate select-all"
                        style={{ color: 'var(--joy-charcoal)' }}
                      >
                        {inviteUrl}
                      </p>
                      <p className="text-[10px] mt-0.5 text-[#0369a1]">
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
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border hover:bg-white shadow-2xs"
                        style={{
                          background: 'rgba(255, 255, 255, 0.85)',
                          borderColor: 'rgba(207, 232, 243, 0.95)',
                          color: '#0369a1',
                        }}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Bagikan</span>
                      </button>

                      {/* Copy Link Button */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(t)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border hover:bg-white shadow-2xs"
                        style={{
                          background: 'rgba(255, 255, 255, 0.85)',
                          borderColor: 'rgba(207, 232, 243, 0.95)',
                          color: 'var(--joy-charcoal)',
                        }}
                      >
                        {copiedTokenId === t.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[var(--success)]" />
                            <span style={{ color: 'var(--success-text)' }}>Tersalin</span>
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
                          className="p-2 rounded-xl transition-colors hover:bg-red-100 text-[var(--danger)] cursor-pointer"
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
        className="rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border"
        style={{
          background: 'var(--surface)',
          borderColor: 'rgba(224, 82, 82, 0.25)',
        }}
      >
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold" style={{ color: 'var(--joy-error)' }}>
            Keluar dari Ruang Kenangan
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Menghapus sesi perangkat ini dari room. Kamu butuh tautan undangan untuk masuk kembali.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shrink-0 hover:opacity-90 cursor-pointer active:scale-95 shadow-2xs"
          style={{ background: 'var(--danger-tint)', color: 'var(--joy-error)' }}
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar</span>
        </button>
      </section>

      {/* ── Modal Konfirmasi Keluar / Logout ── */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={e => {
            if (e.target === e.currentTarget) setShowLogoutModal(false)
          }}
        >
          <div
            className="rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-center animate-fade-in-up border"
            style={{
              background: '#FFFFFF',
              borderColor: 'rgba(255, 140, 105, 0.35)',
              boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-xs"
              style={{ background: 'rgba(255, 140, 105, 0.12)', color: '#FF8C69' }}
            >
              <LogOut className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3
                className="text-base font-bold"
                style={{ color: 'var(--joy-charcoal)', fontFamily: 'var(--font-heading)' }}
              >
                Keluar dari Ruang Kenangan?
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Sesi perangkat ini akan dihapus dari room. Kamu butuh tautan undangan untuk masuk kembali.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-[var(--text-secondary)] bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] transition-colors cursor-pointer"
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
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm cursor-pointer"
                style={{
                  background: '#FF8C69',
                  boxShadow: '0 4px 14px rgba(255, 140, 105, 0.35)',
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={e => {
            if (e.target === e.currentTarget && !removingMember) setMemberToRemove(null)
          }}
        >
          <div
            className="rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-center animate-fade-in-up border"
            style={{
              background: '#FFFFFF',
              borderColor: 'rgba(255, 140, 105, 0.35)',
              boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-xs"
              style={{ background: 'rgba(255, 140, 105, 0.12)', color: '#FF8C69' }}
            >
              <UserMinus className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3
                className="text-base font-bold"
                style={{ color: 'var(--joy-charcoal)', fontFamily: 'var(--font-heading)' }}
              >
                Keluarkan {memberToRemove.name} dari room ini?
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {memberToRemove.name} tidak akan bisa mengakses room ini lagi kecuali diundang ulang.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                disabled={removingMember}
                onClick={() => setMemberToRemove(null)}
                className="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-[var(--text-secondary)] bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={removingMember}
                onClick={handleConfirmRemoveMember}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95 shadow-sm cursor-pointer disabled:opacity-50"
                style={{
                  background: '#FF8C69',
                  boxShadow: '0 4px 14px rgba(255, 140, 105, 0.35)',
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
