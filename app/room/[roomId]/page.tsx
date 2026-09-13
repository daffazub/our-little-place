'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Image as ImageIcon,
  BookOpen,
  Calendar,
  Gift,
  Plus,
  ArrowRight,
  Users,
  Heart,
} from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { getMediaUrl } from '@/lib/storage'
import type { Memory, Story } from '@/types/database'

/* ────────────────────────────────────────────────────────
   Count-Up Hook
──────────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  const started = useRef(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (started.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return
        started.current = true
        const start = performance.now()
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setValue(Math.round(eased * target))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return { value, ref }
}

/* ────────────────────────────────────────────────────────
   Hero Card
──────────────────────────────────────────────────────── */
function HeroCard({
  roomName,
  membersCount,
  memoriesCount,
}: {
  roomName: string
  membersCount: number
  memoriesCount: number
}) {
  const members = useCountUp(membersCount)
  const memories = useCountUp(memoriesCount)

  return (
    <div ref={members.ref}>
      <section
        className="relative overflow-hidden rounded-[22px] p-7 sm:p-10 shadow-lg"
        style={{ background: 'var(--gradient-hero)' }}
      >
        {/* Decorative blobs */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-40 blur-3xl"
          style={{ background: 'var(--joy-blue)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 rounded-full opacity-30 blur-3xl"
          style={{ background: 'var(--joy-green-light)' }}
        />

        <div className="relative z-10 max-w-xl space-y-4">
          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm"
            style={{ background: 'rgba(255,255,255,0.55)', color: 'var(--joy-charcoal)' }}
          >
            <Heart className="w-3.5 h-3.5" style={{ color: 'var(--joy-peach)' }} />
            Ruang Kenangan Bersama
          </div>

          {/* Heading */}
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--joy-charcoal)' }}
          >
            {roomName}
          </h1>

          {/* Sub-text */}
          <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#555' }}>
            Abadikan setiap tawa, cerita, dan momen tak terlupakan bersama orang-orang tersayang.
          </p>

          {/* Stats badges */}
          <div className="pt-1 flex flex-wrap gap-3">
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold shadow-sm"
              style={{ background: 'rgba(255,255,255,0.6)', color: 'var(--joy-charcoal)' }}
            >
              <Users className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span>
                <span className="text-lg font-bold">{members.value}</span> Sahabat
              </span>
            </div>
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold shadow-sm"
              style={{ background: 'rgba(255,255,255,0.6)', color: 'var(--joy-charcoal)' }}
            >
              <ImageIcon className="w-4 h-4" style={{ color: 'var(--joy-peach)' }} />
              <span>
                <span className="text-lg font-bold">{memories.value}</span> Kenangan
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ────────────────────────────────────────────────────────
   Photo Marquee
──────────────────────────────────────────────────────── */
function PhotoMarquee({
  memories,
  roomId,
}: {
  memories: Memory[]
  roomId: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)

  // Pause when out of viewport
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setPaused(!entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const allPhotos = memories.flatMap((m) =>
    (m.photos ?? []).map((p) => ({ url: p.url || p.storage_path, title: m.title }))
  )

  // Empty state
  if (allPhotos.length === 0) {
    return (
      <section className="rounded-[22px] border-2 border-dashed py-12 text-center space-y-3"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
          style={{ background: 'var(--joy-yellow-light)' }}
        >
          <ImageIcon className="w-7 h-7" style={{ color: 'var(--joy-peach)' }} />
        </div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
          Belum ada kenangan — yuk unggah momen pertama kalian!
        </p>
        <Link
          href={`/room/${roomId}/memories`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
          style={{ background: 'var(--gradient-memory)', color: 'var(--joy-charcoal)' }}
        >
          <Plus className="w-3.5 h-3.5" /> Tambah Kenangan
        </Link>
      </section>
    )
  }

  // < 3 photos → static grid fallback
  if (allPhotos.length < 3) {
    return (
      <section>
        <div className="flex gap-3">
          {allPhotos.map((p, i) => (
            <div
              key={i}
              className="h-36 flex-1 rounded-2xl overflow-hidden shadow-sm"
            >
              <img
                src={getMediaUrl(p.url)}
                alt={p.title}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </section>
    )
  }

  // Marquee (duplicate for infinite loop)
  const displayPhotos = [...allPhotos, ...allPhotos]
  const animClass = allPhotos.length < 5 ? 'animate-marquee-slow' : 'animate-marquee'

  return (
    <section ref={containerRef} className="overflow-hidden rounded-[22px] select-none">
      <div
        className={`flex gap-3 w-max ${animClass}`}
        style={{ animationPlayState: paused ? 'paused' : 'running' }}
      >
        {displayPhotos.map((p, i) => (
          <div
            key={i}
            className="h-44 w-64 rounded-2xl overflow-hidden shrink-0 shadow-sm hover:shadow-md transition-shadow"
          >
            <img
              src={getMediaUrl(p.url)}
              alt={p.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────
   Story Card
──────────────────────────────────────────────────────── */
function StoryCard({ story, index }: { story: Story; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="p-5 rounded-[18px] shadow-sm hover:shadow-md transition-shadow"
      style={{ background: 'var(--gradient-story)' }}
    >
      <h3
        className="text-sm font-bold leading-snug"
        style={{ color: 'var(--joy-charcoal)', fontFamily: 'var(--font-heading)' }}
      >
        {story.title}
      </h3>
      <p className="text-xs leading-relaxed mt-1.5 line-clamp-3" style={{ color: '#4a5568' }}>
        {story.content}
      </p>
      {story.date && (
        <span className="inline-block text-[10px] mt-3 font-medium" style={{ color: '#78716c' }}>
          {story.date}
        </span>
      )}
    </motion.div>
  )
}

/* ────────────────────────────────────────────────────────
   Quick Access Cards
──────────────────────────────────────────────────────── */
const QUICK_CARDS = [
  {
    label: 'Kenangan',
    desc: 'Galeri foto & momen',
    href: (id: string) => `/room/${id}/memories`,
    Icon: ImageIcon,
    gradient: 'var(--gradient-memory)',
  },
  {
    label: 'Cerita',
    desc: 'Jurnal & kisah',
    href: (id: string) => `/room/${id}/stories`,
    Icon: BookOpen,
    gradient: 'var(--gradient-story)',
  },
  {
    label: 'Rencana',
    desc: 'Agenda & jadwal',
    href: (id: string) => `/room/${id}/plans`,
    Icon: Calendar,
    gradient: 'var(--gradient-plan)',
  },
  {
    label: 'Kalender',
    desc: 'Ulang tahun & momen',
    href: (id: string) => `/room/${id}/calendar`,
    Icon: Gift,
    gradient: 'var(--gradient-date)',
  },
]

/* ────────────────────────────────────────────────────────
   Dashboard Page
──────────────────────────────────────────────────────── */
export default function RoomDashboardPage() {
  const params = useParams<{ roomId: string }>()
  const { session } = useSession()

  const [membersCount, setMembersCount] = useState(1)
  const [recentMemories, setRecentMemories] = useState<Memory[]>([])
  const [recentStories, setRecentStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!params.roomId) return
    setLoading(true)
    try {
      const roomId = params.roomId

      // Members
      const membersSnap = await getDocs(collection(db, 'rooms', roomId, 'members'))
      setMembersCount(membersSnap.size || 1)

      // Memories (recent 8 for marquee)
      try {
        const memQ = query(
          collection(db, 'rooms', roomId, 'memories'),
          orderBy('date', 'desc'),
          limit(8)
        )
        const memSnap = await getDocs(memQ)
        setRecentMemories(memSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Memory)))
      } catch {
        const memSnap = await getDocs(collection(db, 'rooms', roomId, 'memories'))
        const list = memSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Memory))
        list.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        setRecentMemories(list.slice(0, 8))
      }

      // Stories (recent 4)
      try {
        const stQ = query(
          collection(db, 'rooms', roomId, 'stories'),
          orderBy('created_at', 'desc'),
          limit(4)
        )
        const stSnap = await getDocs(stQ)
        setRecentStories(stSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Story)))
      } catch {
        const stSnap = await getDocs(collection(db, 'rooms', roomId, 'stories'))
        const list = stSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Story))
        list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
        setRecentStories(list.slice(0, 4))
      }
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }, [params.roomId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const roomName = session?.room?.name || 'Tempat Kenangan Kita'
  const roomId = params.roomId

  // Total photos count
  const totalPhotos = recentMemories.reduce(
    (sum, m) => sum + (m.photos?.length ?? 0),
    0
  )

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-7">

      {/* ── Hero Card ── */}
      {loading ? (
        <div className="h-56 skeleton rounded-[22px]" />
      ) : (
        <HeroCard
          roomName={roomName}
          membersCount={membersCount}
          memoriesCount={totalPhotos || recentMemories.length}
        />
      )}

      {/* ── Quick Access ── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_CARDS.map(({ label, desc, href, Icon, gradient }) => (
          <Link
            key={label}
            href={href(roomId)}
            className="group p-4 rounded-[18px] flex flex-col items-center text-center gap-2.5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
            style={{ background: gradient }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/50 group-hover:scale-110 transition-transform">
              <Icon className="w-5 h-5" style={{ color: 'var(--joy-charcoal)' }} />
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: 'var(--joy-charcoal)' }}>{label}</p>
              <p className="text-[11px] opacity-70" style={{ color: 'var(--joy-charcoal)' }}>{desc}</p>
            </div>
          </Link>
        ))}
      </section>

      {/* ── Photo Marquee ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-base font-bold"
            style={{ color: 'var(--joy-charcoal)', fontFamily: 'var(--font-heading)' }}
          >
            📸 Kenangan Terbaru
          </h2>
          <Link
            href={`/room/${roomId}/memories`}
            className="text-xs font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--accent-text)' }}
          >
            Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="h-44 skeleton rounded-[22px]" />
        ) : (
          <PhotoMarquee memories={recentMemories} roomId={roomId} />
        )}
      </section>

      {/* ── Recent Stories ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-base font-bold"
            style={{ color: 'var(--joy-charcoal)', fontFamily: 'var(--font-heading)' }}
          >
            📖 Cerita Terbaru
          </h2>
          <Link
            href={`/room/${roomId}/stories`}
            className="text-xs font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--accent-text)' }}
          >
            Tulis Cerita <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-20 skeleton rounded-[18px]" />
            <div className="h-20 skeleton rounded-[18px]" />
          </div>
        ) : recentStories.length === 0 ? (
          <div
            className="rounded-[18px] border-2 border-dashed py-10 text-center space-y-2"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <div
              className="w-14 h-14 rounded-full mx-auto flex items-center justify-center"
              style={{ background: 'var(--joy-green-light)' }}
            >
              <BookOpen className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Belum ada cerita ditulis
            </p>
            <Link
              href={`/room/${roomId}/stories`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
              style={{ background: 'var(--gradient-story)', color: 'var(--joy-charcoal)' }}
            >
              <Plus className="w-3.5 h-3.5" /> Tulis Pertama
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentStories.map((story, i) => (
              <StoryCard key={story.id} story={story} index={i} />
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
