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
   Count-Up Hook (Reliable & Reactive)
──────────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(target)

  useEffect(() => {
    let startTime: number | null = null
    const startVal = 0

    if (target === 0) {
      setValue(0)
      return
    }

    let animId: number
    const tick = (now: number) => {
      if (!startTime) startTime = now
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(startVal + target * eased))
      if (progress < 1) {
        animId = requestAnimationFrame(tick)
      } else {
        setValue(target)
      }
    }

    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [target, duration])

  return value
}

/* ────────────────────────────────────────────────────────
   Hero Card
──────────────────────────────────────────────────────── */
function HeroCard({
  roomName,
  membersCount,
  memoriesCount,
  photosCount,
}: {
  roomName: string
  membersCount: number
  memoriesCount: number
  photosCount: number
}) {
  const members = useCountUp(membersCount)
  const memories = useCountUp(memoriesCount)
  const photos = useCountUp(photosCount)

  return (
    <div className="select-none cursor-default">
      <section
        className="relative overflow-hidden rounded-3xl p-7 sm:p-10 shadow-lg select-none cursor-default"
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
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm shadow-2xs"
            style={{ background: 'rgba(255,255,255,0.7)', color: 'var(--joy-charcoal)' }}
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
          <p className="text-sm sm:text-base leading-relaxed text-[#4b5563]">
            Abadikan setiap tawa, cerita, dan momen tak terlupakan bersama orang-orang tersayang.
          </p>

          {/* Stats badges */}
          <div className="pt-1 flex flex-wrap gap-3">
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold shadow-xs"
              style={{ background: 'rgba(255,255,255,0.75)', color: 'var(--joy-charcoal)' }}
            >
              <Users className="w-4 h-4 text-[var(--joy-peach)]" />
              <span>
                <span className="text-lg font-bold">{members}</span> Sahabat
              </span>
            </div>
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold shadow-xs"
              style={{ background: 'rgba(255,255,255,0.75)', color: 'var(--joy-charcoal)' }}
            >
              <ImageIcon className="w-4 h-4 text-[var(--accent)]" />
              <span>
                <span className="text-lg font-bold">{memories}</span> Kenangan
                {photos > 0 && (
                  <span className="text-xs opacity-75 ml-1 font-medium">({photos} Foto)</span>
                )}
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

  // Extract all photos, randomly shuffle them, and limit to max 20 photos
  const selectedPhotos = React.useMemo(() => {
    const raw = memories.flatMap((m) =>
      (m.photos ?? []).map((p) => ({
        url: p.url || p.storage_path,
        title: m.title,
      }))
    )

    // Random shuffle so it's always fresh and not always the same photos
    const shuffled = [...raw].sort(() => Math.random() - 0.5)

    // Limit to max 20 photos per user request
    return shuffled.slice(0, 20)
  }, [memories])

  // Empty state
  if (selectedPhotos.length === 0) {
    return (
      <section
        className="rounded-3xl border-2 border-dashed py-12 text-center space-y-3 select-none cursor-default"
        style={{ borderColor: 'rgba(255, 217, 125, 0.6)', background: 'var(--surface)' }}
      >
        <div
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-xs"
          style={{ background: 'var(--joy-yellow-light)' }}
        >
          <ImageIcon className="w-7 h-7" style={{ color: 'var(--joy-peach)' }} />
        </div>
        <p className="text-sm font-semibold text-[var(--text-secondary)]">
          Belum ada kenangan — yuk unggah momen pertama kalian!
        </p>
        <Link
          href={`/room/${roomId}/memories`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 shadow-xs cursor-pointer"
          style={{ background: 'var(--gradient-memory)', color: 'var(--joy-charcoal)' }}
        >
          <Plus className="w-3.5 h-3.5" /> Tambah Kenangan
        </Link>
      </section>
    )
  }

  // < 3 photos → static grid fallback
  if (selectedPhotos.length < 3) {
    return (
      <section className="select-none cursor-default">
        <div className="flex gap-3">
          {selectedPhotos.map((p, i) => (
            <Link
              key={i}
              href={`/room/${roomId}/memories`}
              className="h-36 flex-1 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer relative group block"
            >
              <img
                src={getMediaUrl(p.url)}
                alt={p.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                <span className="text-xs font-bold text-white truncate">{p.title}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    )
  }

  // Marquee (duplicate for seamless infinite loop)
  const displayPhotos = [...selectedPhotos, ...selectedPhotos]
  const animClass = selectedPhotos.length < 5 ? 'animate-marquee-slow' : 'animate-marquee'

  return (
    <section
      ref={containerRef}
      className="overflow-hidden rounded-3xl select-none cursor-default"
      style={{
        maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
      }}
    >
      <div
        className={`flex gap-3.5 w-max ${animClass}`}
        style={{ animationPlayState: paused ? 'paused' : 'running' }}
      >
        {displayPhotos.map((p, i) => (
          <Link
            key={i}
            href={`/room/${roomId}/memories`}
            className="h-44 w-64 rounded-2xl overflow-hidden shrink-0 shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer relative group block border border-[rgba(255,217,125,0.4)]"
            style={{
              background: 'var(--surface)',
            }}
          >
            <img
              src={getMediaUrl(p.url)}
              alt={p.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {/* Soft gradient title overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
              <span className="text-xs font-bold text-white truncate drop-shadow-sm">
                {p.title}
              </span>
            </div>
          </Link>
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

      // Memories (fetch up to 50 memories for rich random photo pool)
      try {
        const memQ = query(
          collection(db, 'rooms', roomId, 'memories'),
          orderBy('date', 'desc'),
          limit(50)
        )
        const memSnap = await getDocs(memQ)
        setRecentMemories(memSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Memory)))
      } catch {
        const memSnap = await getDocs(collection(db, 'rooms', roomId, 'memories'))
        const list = memSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Memory))
        list.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        setRecentMemories(list.slice(0, 50))
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-7 select-none">

      {/* ── Hero Card ── */}
      {loading ? (
        <div className="h-56 skeleton rounded-[22px]" />
      ) : (
        <HeroCard
          roomName={roomName}
          membersCount={membersCount}
          memoriesCount={recentMemories.length}
          photosCount={totalPhotos}
        />
      )}

      {/* ── Quick Access ── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 select-none">
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
