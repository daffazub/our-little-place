'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Sparkles,
  Image as ImageIcon,
  BookOpen,
  Calendar,
  Gift,
  Heart,
  Plus,
  ArrowRight,
  Users,
  Clock,
} from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { getMediaUrl } from '@/lib/storage'
import type { Memory, Story, Plan } from '@/types/database'

export default function RoomDashboardPage() {
  const params = useParams<{ roomId: string }>()
  const { session } = useSession()

  const [membersCount, setMembersCount] = useState<number>(1)
  const [recentMemories, setRecentMemories] = useState<Memory[]>([])
  const [upcomingPlans, setUpcomingPlans] = useState<Plan[]>([])
  const [recentStories, setRecentStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      if (!params.roomId) return
      setLoading(true)

      try {
        const roomId = params.roomId

        // 1. Members count
        const membersRef = collection(db, 'rooms', roomId, 'members')
        const membersSnap = await getDocs(membersRef)
        setMembersCount(membersSnap.size || 1)

        // 2. Recent Memories
        try {
          const memQuery = query(
            collection(db, 'rooms', roomId, 'memories'),
            orderBy('date', 'desc'),
            limit(4)
          )
          const memSnap = await getDocs(memQuery)
          setRecentMemories(memSnap.docs.map(d => ({ id: d.id, ...d.data() } as Memory)))
        } catch {
          // Fallback if no index
          const memSnap = await getDocs(collection(db, 'rooms', roomId, 'memories'))
          const list = memSnap.docs.map(d => ({ id: d.id, ...d.data() } as Memory))
          list.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
          setRecentMemories(list.slice(0, 4))
        }

        // 3. Upcoming Plans
        try {
          const plansQuery = query(
            collection(db, 'rooms', roomId, 'plans'),
            where('status', '==', 'upcoming'),
            orderBy('date', 'asc'),
            limit(3)
          )
          const plansSnap = await getDocs(plansQuery)
          setUpcomingPlans(plansSnap.docs.map(d => ({ id: d.id, ...d.data() } as Plan)))
        } catch {
          const plansSnap = await getDocs(collection(db, 'rooms', roomId, 'plans'))
          const list = plansSnap.docs
            .map(d => ({ id: d.id, ...d.data() } as Plan))
            .filter(p => p.status === 'upcoming')
          list.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
          setUpcomingPlans(list.slice(0, 3))
        }

        // 4. Recent Stories
        try {
          const storiesQuery = query(
            collection(db, 'rooms', roomId, 'stories'),
            orderBy('created_at', 'desc'),
            limit(2)
          )
          const storiesSnap = await getDocs(storiesQuery)
          setRecentStories(storiesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Story)))
        } catch {
          const storiesSnap = await getDocs(collection(db, 'rooms', roomId, 'stories'))
          const list = storiesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Story))
          list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
          setRecentStories(list.slice(0, 2))
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [params.roomId])

  const roomName = session?.room?.name || 'Tempat Kenangan'

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--accent)] to-[#094844] text-[var(--accent-contrast)] p-6 sm:p-8 shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ruang Kenangan Bersama</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat datang di {roomName}!
          </h1>
          <p className="text-sm sm:text-base opacity-90 leading-relaxed">
            Abadikan setiap tawa, cerita, dan momen tak terlupakan bersama orang-orang tersayang di sini.
          </p>

          {/* Quick stats pills */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-medium">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm">
              <Users className="w-3.5 h-3.5" />
              <span>{membersCount} Sahabat Terhubung</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{recentMemories.length} Kenangan Tersimpan</span>
            </div>
          </div>
        </div>

        {/* Decorative circle glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </section>

      {/* Quick Access Action Bar */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href={`/room/${params.roomId}/memories`}
          className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-tint)] transition-all group shadow-sm flex flex-col items-center text-center gap-2"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-tint)] text-[var(--accent-text)] group-hover:scale-110 transition-transform flex items-center justify-center">
            <ImageIcon className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-[var(--text-primary)]">Kenangan</span>
          <span className="text-[11px] text-[var(--text-muted)]">Galeri foto & momen</span>
        </Link>

        <Link
          href={`/room/${params.roomId}/stories`}
          className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-tint)] transition-all group shadow-sm flex flex-col items-center text-center gap-2"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--warm-tint)] text-[var(--warm)] group-hover:scale-110 transition-transform flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-[var(--text-primary)]">Cerita</span>
          <span className="text-[11px] text-[var(--text-muted)]">Jurnal & kisah</span>
        </Link>

        <Link
          href={`/room/${params.roomId}/plans`}
          className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-tint)] transition-all group shadow-sm flex flex-col items-center text-center gap-2"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--success-tint)] text-[var(--success)] group-hover:scale-110 transition-transform flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-[var(--text-primary)]">Rencana</span>
          <span className="text-[11px] text-[var(--text-muted)]">Agenda & jadwal</span>
        </Link>

        <Link
          href={`/room/${params.roomId}/calendar`}
          className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-tint)] transition-all group shadow-sm flex flex-col items-center text-center gap-2"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-tint)] text-[var(--accent-text)] group-hover:scale-110 transition-transform flex items-center justify-center">
            <Gift className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-[var(--text-primary)]">Kalender</span>
          <span className="text-[11px] text-[var(--text-muted)]">Ulang tahun & momen</span>
        </Link>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Memories & Stories */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Memories */}
          <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[var(--accent-text)]" />
                Kenangan Terbaru
              </h2>
              <Link
                href={`/room/${params.roomId}/memories`}
                className="text-xs font-semibold text-[var(--accent-text)] hover:underline flex items-center gap-1"
              >
                Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="h-32 skeleton rounded-2xl" />
                <div className="h-32 skeleton rounded-2xl" />
              </div>
            ) : recentMemories.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-[var(--border)] rounded-2xl">
                <ImageIcon className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                <p className="text-xs font-semibold text-[var(--text-secondary)]">
                  Belum ada kenangan yang diunggah
                </p>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Mulai simpan momen pertama kamu bersama teman-teman!
                </p>
                <Link
                  href={`/room/${params.roomId}/memories`}
                  className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-bold hover:bg-[var(--accent-hover)] transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Kenangan
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {recentMemories.map((memory) => {
                  const cover = memory.photos?.[0]?.url || memory.photos?.[0]?.storage_path || memory.memory_photos?.[0]?.storage_path
                  return (
                    <div
                      key={memory.id}
                      className="group relative rounded-2xl overflow-hidden bg-[var(--surface-elevated)] border border-[var(--border)] aspect-square flex flex-col justify-end p-2.5"
                    >
                      {cover ? (
                        <img
                          src={getMediaUrl(cover)}
                          alt={memory.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] to-[var(--surface-elevated)]" />
                      )}
                      <div className="relative z-10 bg-black/40 backdrop-blur-xs p-1.5 rounded-xl text-white">
                        <p className="text-[11px] font-bold truncate">{memory.title}</p>
                        <p className="text-[9px] opacity-80">{memory.date}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Stories */}
          <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[var(--warm)]" />
                Cerita & Jurnal
              </h2>
              <Link
                href={`/room/${params.roomId}/stories`}
                className="text-xs font-semibold text-[var(--accent-text)] hover:underline flex items-center gap-1"
              >
                Tulis Cerita <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <div className="h-16 skeleton rounded-2xl" />
                <div className="h-16 skeleton rounded-2xl" />
              </div>
            ) : recentStories.length === 0 ? (
              <div className="text-center py-6 px-4 border border-dashed border-[var(--border)] rounded-2xl">
                <p className="text-xs text-[var(--text-muted)]">Belum ada cerita yang ditulis.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentStories.map((story) => (
                  <div
                    key={story.id}
                    className="p-4 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] hover:border-[var(--accent-border)] transition-colors"
                  >
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">{story.title}</h3>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-1">
                      {story.content}
                    </p>
                    <span className="inline-block text-[10px] text-[var(--text-muted)] mt-2">
                      {story.date}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Upcoming Plans & Info */}
        <div className="space-y-6">
          {/* Upcoming Plans */}
          <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--success)]" />
                Agenda Mendatang
              </h2>
              <Link
                href={`/room/${params.roomId}/plans`}
                className="text-xs font-semibold text-[var(--accent-text)] hover:underline"
              >
                Semua
              </Link>
            </div>

            {loading ? (
              <div className="space-y-2">
                <div className="h-12 skeleton rounded-xl" />
                <div className="h-12 skeleton rounded-xl" />
              </div>
            ) : upcomingPlans.length === 0 ? (
              <div className="text-center py-5 border border-dashed border-[var(--border)] rounded-2xl">
                <p className="text-xs text-[var(--text-muted)]">Tidak ada rencana terdekat.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--success-tint)] text-[var(--success)] flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {plan.title}
                      </h4>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {plan.date} {plan.time ? `• ${plan.time}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Room Info Card */}
          <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">
              <Heart className="w-3.5 h-3.5 text-[var(--favorite)]" />
              Tentang Ruang Ini
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Ruang pribadi ini terenkripsi dan terlindungi. Hanya orang dengan link undangan resmi yang dapat melihat dan berkontribusi.
            </p>
            <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>Status Koneksi:</span>
              <span className="inline-flex items-center gap-1.5 text-[var(--success-text)] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
                Aktif & Aman
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
