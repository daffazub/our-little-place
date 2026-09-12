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
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import { supabase } from '@/lib/supabase/client'
import {
  getRoomMembers,
  getActiveInviteTokens,
  generateInviteToken,
  revokeInviteToken,
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
    if (!roomName.trim() || !isOwner) return
    setActionLoading(true)
    setNotice(null)

    try {
      const { error } = await supabase
        .from('rooms')
        .update({ name: roomName.trim() })
        .eq('id', params.roomId)

      if (error) throw new Error(error.message)

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
    if (!session || !isOwner) return
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
    if (!isOwner) return
    try {
      await revokeInviteToken(tokenId)
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Settings className="w-6 h-6 text-[var(--accent-text)]" />
          Pengaturan & Anggota
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Kelola nama ruang kenangan, anggota yang terhubung, dan link undangan.
        </p>
      </div>

      {notice && (
        <div
          className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
            notice.isError
              ? 'bg-[var(--danger-tint)] text-[var(--danger-text)]'
              : 'bg-[var(--success-tint)] text-[var(--success-text)]'
          }`}
        >
          {notice.isError ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          {notice.text}
        </div>
      )}

      {/* 1. Room Info & Rename (Owner only) */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[var(--accent-text)]" />
          Informasi Tempat Kenangan
        </h2>

        {isOwner ? (
          <form onSubmit={handleUpdateRoomName} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wide">
                Nama Ruang Kenangan
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  placeholder="Nama room..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-border)]"
                />
                <button
                  type="submit"
                  disabled={actionLoading || !roomName.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-bold hover:bg-[var(--accent-hover)] transition-all disabled:opacity-50"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Nama Tempat:</p>
            <p className="text-base font-bold text-[var(--text-primary)]">{roomName}</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              (Hanya pembuat room yang dapat mengubah nama tempat).
            </p>
          </div>
        )}
      </section>

      {/* 2. Anggota Terhubung */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--accent-text)]" />
            Anggota Terhubung ({members.length})
          </h2>
          <button
            onClick={loadData}
            title="Muat ulang"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-elevated)]"
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
          <div className="divide-y divide-[var(--border)]">
            {members.map(member => (
              <div key={member.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl overflow-hidden bg-[var(--surface-elevated)] border border-[var(--border)] shrink-0">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-xs text-[var(--accent-text)]">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {member.name} {member.id === session?.id && '(Kamu)'}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Bergabung sejak {new Date(member.joined_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    member.role === 'owner'
                      ? 'bg-[var(--accent-tint)] text-[var(--accent-text)]'
                      : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)]'
                  }`}
                >
                  {member.role === 'owner' ? '👑 Pemilik' : 'Sahabat'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Link Undangan (Invite Tokens) */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Key className="w-4 h-4 text-[var(--warm)]" />
            Link Undangan Aktif
          </h2>

          {isOwner && (
            <button
              onClick={handleCreateNewToken}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-bold hover:bg-[var(--accent-hover)] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Buat Link Baru
            </button>
          )}
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Bagikan link ini kepada sahabat yang ingin kamu ajak masuk ke ruang kenangan ini.
        </p>

        {tokens.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[var(--surface-subtle)] border border-dashed border-[var(--border)] text-center text-xs text-[var(--text-muted)]">
            Tidak ada link undangan aktif saat ini.
          </div>
        ) : (
          <div className="space-y-2.5">
            {tokens.map(t => (
              <div
                key={t.id}
                className="p-3.5 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-mono text-[var(--text-primary)] truncate font-semibold">
                    {typeof window !== 'undefined' ? `${window.location.origin}/join/${params.roomId}/${t.token}` : t.token}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    Dibuat {new Date(t.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyLink(t)}
                    className="px-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-border)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
                  >
                    {copiedTokenId === t.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[var(--success)]" />
                        <span className="text-[var(--success-text)]">Tersalin</span>
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
                      className="p-1.5 rounded-xl text-[var(--danger)] hover:bg-[var(--danger-tint)] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Keluar dari Room */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[var(--danger)]">Keluar dari Ruang Kenangan</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Menghapus sesi perangkat ini dari room. Kamu butuh link undangan untuk masuk kembali.
          </p>
        </div>

        <button
          onClick={() => {
            logout()
            router.push('/create')
          }}
          className="px-4 py-2 rounded-2xl bg-[var(--danger-tint)] text-[var(--danger)] text-xs font-bold hover:bg-[var(--danger)] hover:text-white transition-all flex items-center gap-2 shrink-0"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </section>
    </div>
  )
}
