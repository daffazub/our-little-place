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
} from '@/lib/auth'
import type { Member, InviteToken } from '@/types/database'

export default function SettingsPage() {
  const params = useParams<{ roomId: string }>()
  const router = useRouter()
  const { session, logout, isOwner, refreshSession } = useSession()

  const [members, setMembers] = useState<Member[]>([])
  const [tokens, setTokens] = useState<InviteToken[]>([])
  const [roomName, setRoomName] = useState('')
  const [loading, setLoading] = useState(true)
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [notice, setNotice] = useState<{ text: string; isError?: boolean } | null>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null)
  const [removingMember, setRemovingMember] = useState(false)

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
      if (session?.room?.name) {
        setRoomName(session.room.name)
      }
    } catch (err) {
      console.error('Failed to load settings data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [params.roomId, session?.room?.name])

  const handleUpdateRoomName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomName.trim() || !isOwner || !params.roomId) return
    setActionLoading(true)
    setNotice(null)

    try {
      const roomRef = doc(db, 'rooms', params.roomId)
      await updateDoc(roomRef, { name: roomName.trim() })

      await refreshSession()
      setNotice({ text: 'Nama tempat kenangan berhasil diperbarui!' })
    } catch (err) {
      setNotice({
        text: err instanceof Error ? err.message : 'Gagal memperbarui nama room.',
        isError: true,
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateNewToken = async () => {
    if (!session || !isOwner || !params.roomId) return
    setActionLoading(true)
    try {
      await generateInviteToken(params.roomId, session.id)
      await loadData()
      setNotice({ text: 'Link undangan baru berhasil dibuat!' })
    } catch (err) {
      setNotice({ text: 'Gagal membuat token baru.', isError: true })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRevokeToken = async (tokenId: string) => {
    if (!isOwner || !params.roomId) return
    try {
      await revokeInviteToken(params.roomId, tokenId)
      await loadData()
      setNotice({ text: 'Link undangan berhasil dinonaktifkan.' })
    } catch (err) {
      setNotice({ text: 'Gagal menonaktifkan token.', isError: true })
    }
  }

  const handleCopyLink = async (token: InviteToken) => {
    const inviteUrl = `${window.location.origin}/join/${params.roomId}/${token.token}`
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(inviteUrl)
      setCopiedTokenId(token.id)
      setTimeout(() => setCopiedTokenId(null), 2500)
    }
  }

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove || !params.roomId) return
    setRemovingMember(true)
    try {
      await removeMember(params.roomId, memberToRemove.id)
      setMemberToRemove(null)
      await loadData()
      setNotice({ text: `${memberToRemove.name} berhasil dikeluarkan dari room.` })
    } catch (err) {
      setNotice({ text: 'Gagal mengeluarkan anggota.', isError: true })
    } finally {
      setRemovingMember(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--joy-charcoal)', fontFamily: 'var(--font-heading)' }}
        >
          ⚙️ Pengaturan &amp; Anggota
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Kelola nama ruang kenangan, anggota yang terhubung, dan link undangan.
        </p>
      </div>

      {notice && (
        <div
          className="p-3 rounded-2xl text-xs font-semibold flex items-center gap-2"
          style={
            notice.isError
              ? { background: 'var(--danger-tint)', color: 'var(--danger-text)' }
              : { background: 'var(--joy-green-light)', color: '#2d6a4a' }
          }
        >
          {notice.isError ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          {notice.text}
        </div>
      )}

      {/* 1. Room Info & Rename */}
      <section
        className="rounded-3xl overflow-hidden shadow-sm"
        style={{ border: '1px solid var(--border)' }}
      >
        <div className="h-1.5" style={{ background: 'var(--gradient-story)' }} />
        <div className="p-6 space-y-4" style={{ background: 'var(--surface)' }}>
          <h2
            className="text-sm font-bold flex items-center gap-2"
            style={{ color: 'var(--joy-charcoal)' }}
          >
            <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            Informasi Tempat Kenangan
          </h2>

          {isOwner ? (
            <form onSubmit={handleUpdateRoomName} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  Nama Ruang Kenangan
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={roomName}
                    onChange={e => setRoomName(e.target.value)}
                    placeholder="Nama room..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl text-xs outline-none transition-colors"
                    style={{
                      background: 'var(--surface-subtle)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'var(--joy-green)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                  <button
                    type="submit"
                    disabled={actionLoading || !roomName.trim()}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'var(--gradient-story)', color: 'var(--joy-charcoal)' }}
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Nama Tempat:</p>
              <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{roomName}</p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                (Hanya pembuat room yang dapat mengubah nama tempat).
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 2. Anggota Terhubung */}
      <section
        className="rounded-3xl overflow-hidden shadow-sm"
        style={{ border: '1px solid var(--border)' }}
      >
        <div className="h-1.5" style={{ background: 'var(--gradient-memory)' }} />
        <div className="p-6 space-y-4" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between">
            <h2
              className="text-sm font-bold flex items-center gap-2"
              style={{ color: 'var(--joy-charcoal)' }}
            >
              <Users className="w-4 h-4" style={{ color: 'var(--joy-peach)' }} />
              Anggota Terhubung ({members.length})
            </h2>
            <button
              onClick={loadData}
              title="Muat ulang"
              className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
              style={{ color: 'var(--text-muted)' }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="h-14 skeleton rounded-2xl" />
              <div className="h-14 skeleton rounded-2xl" />
            </div>
          ) : (
            <div style={{ borderTop: '1px solid var(--border)' }}>
              {members.map(member => (
                <div
                  key={member.id}
                  className="py-3 flex items-center justify-between gap-3"
                  style={{ borderBottom: '1px solid var(--surface-elevated)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-2xl overflow-hidden shrink-0"
                      style={{ background: 'var(--joy-yellow-light)', border: '1px solid var(--border)' }}
                    >
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center font-bold text-xs"
                          style={{ color: 'var(--joy-charcoal)' }}
                        >
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                        {member.name} {member.id === session?.id && '(Kamu)'}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        Bergabung sejak {new Date(member.joined_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={
                        member.role === 'owner'
                          ? { background: 'var(--joy-yellow-light)', color: 'var(--joy-charcoal)' }
                          : { background: 'var(--surface-elevated)', color: 'var(--text-secondary)' }
                      }
                    >
                      {member.role === 'owner' ? '👑 Pemilik' : '🌸 Sahabat'}
                    </span>

                    {isOwner && member.role !== 'owner' && (
                      <button
                        type="button"
                        onClick={() => setMemberToRemove(member)}
                        title={`Keluarkan ${member.name}`}
                        className="p-1.5 rounded-xl hover:bg-red-50 text-[var(--danger)] transition-colors cursor-pointer"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. Link Undangan */}
      <section
        className="rounded-3xl overflow-hidden shadow-sm"
        style={{ border: '1px solid var(--border)' }}
      >
        <div className="h-1.5" style={{ background: 'var(--gradient-plan)' }} />
        <div className="p-6 space-y-4" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between">
            <h2
              className="text-sm font-bold flex items-center gap-2"
              style={{ color: 'var(--joy-charcoal)' }}
            >
              <Key className="w-4 h-4" style={{ color: 'var(--joy-yellow)' }} />
              Link Undangan Aktif
            </h2>

            {isOwner && (
              <button
                onClick={handleCreateNewToken}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--gradient-plan)', color: 'var(--joy-charcoal)' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Buat Link Baru
              </button>
            )}
          </div>

          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Bagikan link ini kepada sahabat yang ingin kamu ajak masuk ke ruang kenangan ini.
          </p>

          {tokens.length === 0 ? (
            <div
              className="p-4 rounded-2xl border-2 border-dashed text-center text-xs"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--surface-subtle)' }}
            >
              Tidak ada link undangan aktif saat ini.
            </div>
          ) : (
            <div className="space-y-2.5">
              {tokens.map(t => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  style={{ background: 'var(--joy-blue)', border: '1px solid rgba(207,232,243,0.8)' }}
                >
                  <div className="min-w-0">
                    <p
                      className="text-xs font-mono truncate font-semibold"
                      style={{ color: 'var(--joy-charcoal)' }}
                    >
                      {typeof window !== 'undefined'
                        ? `${window.location.origin}/join/${params.roomId}/${t.token}`
                        : t.token}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#4a7a8a' }}>
                      Dibuat {new Date(t.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyLink(t)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      style={{
                        background: 'rgba(255,255,255,0.7)',
                        border: '1px solid rgba(207,232,243,0.9)',
                        color: 'var(--joy-charcoal)',
                      }}
                    >
                      {copiedTokenId === t.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                          <span style={{ color: 'var(--success-text)' }}>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Link</span>
                        </>
                      )}
                    </button>

                    {isOwner && (
                      <button
                        onClick={() => handleRevokeToken(t.id)}
                        title="Matikan link ini"
                        className="p-1.5 rounded-xl transition-colors hover:bg-red-100"
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Keluar dari Room */}
      <section
        className="rounded-3xl p-6 shadow-sm flex items-center justify-between"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--danger)' }}>
            Keluar dari Ruang Kenangan
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Menghapus sesi perangkat ini dari room. Kamu butuh link undangan untuk masuk kembali.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 hover:opacity-90 cursor-pointer active:scale-95"
          style={{ background: 'var(--danger-tint)', color: 'var(--danger)' }}
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </section>

      {/* ── Modal Konfirmasi Keluar / Logout ── */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
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
            {/* Friendly Peach/Coral Icon */}
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

            {/* Action Buttons */}
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
          onClick={(e) => {
            if (e.target === e.currentTarget && !removingMember) setMemberToRemove(null)
          }}
        >
          <div
            className="rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-center animate-fade-in-up border"
            style={{
              background: '#FFFFFF',
              borderColor: 'rgba(238, 90, 82, 0.35)',
              boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Soft Danger Icon */}
            <div
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-xs"
              style={{ background: 'var(--danger-tint)', color: 'var(--danger)' }}
            >
              <UserMinus className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3
                className="text-base font-bold"
                style={{ color: 'var(--joy-charcoal)', fontFamily: 'var(--font-heading)' }}
              >
                Keluarkan {memberToRemove.name}?
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Anggota ini akan dihapus dari daftar anggota room. Mereka butuh link undangan baru untuk bisa masuk kembali.
              </p>
            </div>

            {/* Action Buttons */}
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
                  background: 'var(--danger)',
                  boxShadow: '0 4px 14px rgba(238, 90, 82, 0.35)',
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
