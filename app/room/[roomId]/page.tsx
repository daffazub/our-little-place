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
import { getMediaUrl } from '@/lib/utils/image'
import type { Memory, Story, ImportantDate } from '@/types'
import { getDaysTogether, getNextRecurringOccurrence, formatLocalDate } from '@/lib/utils/date'

/* ────────────────────────────────────────────────────────
   Count-Up Hook
──────────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(target)

  useEffect(() => {
    let startTime: number | null = null
    if (target === 0) { setValue(0); return }
    let animId: number
    const tick = (now: number) => {
      if (!startTime) startTime = now
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) animId = requestAnimationFrame(tick)
      else setValue(target)
    }
    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [target, duration])

  return value
}

/* ────────────────────────────────────────────────────────
   Hero Card — "Kertas Hangat" style
──────────────────────────────────────────────────────── */
function HeroCard({
  roomName,
  membersCount,
  memoriesCount,
  photosCount,
  createdAt,
}: {
  roomName: string
  membersCount: number
  memoriesCount: number
  photosCount: number
  createdAt?: string | null
}) {
  const members  = useCountUp(membersCount)
  const memories = useCountUp(memoriesCount)
  const photos   = useCountUp(photosCount)
  const daysTogether = getDaysTogether(createdAt)

  return (
    <section
      className="relative overflow-hidden rounded-3xl p-7 sm:p-10 border select-none cursor-default"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-line)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Tekstur kertas — garis tipis horizontal seperti buku tulis */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, var(--color-line) 0px, var(--color-line) 1px, transparent 1px, transparent 28px)',
        }}
      />

      <div className="relative z-10 max-w-xl space-y-5">
        {/* Eyebrow badge */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border"
            style={{
              background: 'var(--color-honey)',
              borderColor: 'var(--color-honey-line)',
              color: 'var(--color-ink)',
            }}
          >
            <Heart className="w-3.5 h-3.5" style={{ color: 'var(--color-clay)' }} />
            <span>Hari ke-{daysTogether} Bersama</span>
          </div>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
            style={{
              background: 'var(--color-sunken)',
              borderColor: 'var(--color-line)',
              color: 'var(--color-ink-soft)',
            }}
          >
            <span>Ruang Privat Kita</span>
          </div>
        </div>

        {/* Heading */}
        <h1
          className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-[var(--color-ink)]"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {roomName}
        </h1>

        {/* Subtext */}
        <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
          Tempat untuk menyimpan setiap tawa, cerita, dan momen tak terlupakan bersama orang-orang tersayang.
        </p>

        {/* Stats */}
        <div className="flex flex-wrap gap-3 pt-1">
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold border"
            style={{
              background: 'var(--color-sunken)',
              borderColor: 'var(--color-line)',
              color: 'var(--color-ink)',
            }}
          >
            <Users className="w-4 h-4 text-[var(--color-sage-deep)]" />
            <span>
              <span className="text-lg font-bold">{members}</span>
              <span className="ml-1">Sahabat</span>
            </span>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold border"
            style={{
              background: 'var(--color-sunken)',
              borderColor: 'var(--color-line)',
              color: 'var(--color-ink)',
            }}
          >
            <ImageIcon className="w-4 h-4 text-[var(--color-clay)]" />
            <span>
              <span className="text-lg font-bold">{memories}</span>
              <span className="ml-1">Kenangan</span>
              {photos > 0 && (
                <span className="text-xs opacity-60 ml-1 font-medium">({photos} foto)</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────
   Photo Marquee
──────────────────────────────────────────────────────── */
function PhotoMarquee({ memories, roomId }: { memories: Memory[]; roomId: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)

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

  const selectedPhotos = React.useMemo(() => {
    const raw = memories.flatMap((m) =>
      (m.photos ?? []).map((p) => ({ url: p.url || p.storage_path, title: m.title, id: m.id }))
    )
    const shuffled = [...raw].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 20)
  }, [memories])

  if (selectedPhotos.length === 0) {
    return (
      <section
        className="rounded-2xl border-2 border-dashed py-12 text-center space-y-3 select-none"
        style={{ borderColor: 'var(--color-line)', background: 'var(--color-surface)' }}
      >
        <div
          className="w-14 h-14 rounded-full mx-auto flex items-center justify-center border"
          style={{ background: 'var(--color-sunken)', borderColor: 'var(--color-line)' }}
        >
          <ImageIcon className="w-6 h-6 text-[var(--color-clay)]" />
        </div>
        <p className="text-sm font-semibold text-[var(--color-ink-soft)]">
          Belum ada kenangan. Yuk unggah momen pertama!
        </p>
        <Link
          href={`/room/${roomId}/memories`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors hover:opacity-90 cursor-pointer text-[var(--color-white)]"
          style={{ background: 'var(--color-clay)', boxShadow: '0 2px 8px var(--color-clay-shadow-soft)' }}
        >
          <Plus className="w-3.5 h-3.5" /> Tambah Kenangan
        </Link>
      </section>
    )
  }

  if (selectedPhotos.length < 3) {
    return (
      <section className="select-none">
        <div className="flex gap-3">
          {selectedPhotos.map((p, i) => (
            <Link
              key={i}
              href={`/room/${roomId}/memories`}
              className="h-36 flex-1 overflow-hidden shadow-sm hover:shadow-md transition-colors cursor-pointer relative group block border"
              style={{ borderRadius: 'var(--radius-lg)', borderColor: 'var(--color-line)' }}
            >
              <img
                src={getMediaUrl(p.url)}
                alt={p.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                <span className="text-xs font-bold text-[var(--color-white)] truncate">{p.title}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    )
  }

  const displayPhotos = [...selectedPhotos, ...selectedPhotos]
  const animClass = selectedPhotos.length < 5 ? 'animate-marquee-slow' : 'animate-marquee'

  return (
    <section
      ref={containerRef}
      className="overflow-hidden select-none"
      style={{
        borderRadius: 'var(--radius-2xl)',
        maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
      }}
    >
      <div
        className={`flex gap-3.5 w-max ${animClass}`}
        style={{ animationPlayState: paused ? 'paused' : 'running' }}
      >
        {displayPhotos.map((p, i) => {
          // Rotasi deterministik berdasar id foto ±1.5°
          const hashCode = (p.id + i).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
          const rotation = ((hashCode % 30) - 15) / 10  // –1.5° … +1.5°
          return (
            <Link
              key={i}
              href={`/room/${roomId}/memories`}
              className="shrink-0 cursor-pointer relative group block"
              style={{
                width: '15rem',
                height: '11rem',
                transform: `rotate(${rotation}deg)`,
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: '4px solid white',
                boxShadow: 'var(--shadow-card)',
                background: 'var(--color-surface)',
              }}
            >
              <img
                src={getMediaUrl(p.url)}
                alt={p.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                <span className="text-xs font-bold text-[var(--color-white)] truncate drop-shadow-sm">{p.title}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

/* ────────────────────────────────────────────────────────
   Story Card — gaya lembaran jurnal
──────────────────────────────────────────────────────── */
function StoryCard({ story, index }: { story: Story; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="p-5 border transition-shadow hover:shadow-md"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-line)',
        borderRadius: 'var(--radius-2xl)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Garis jurnal tipis — dekorasi */}
      <div
        className="h-px w-8 mb-3"
        style={{ background: 'var(--color-clay)', opacity: 0.5 }}
      />
      <h3
        className="text-sm font-bold leading-snug text-[var(--color-ink)]"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {story.title}
      </h3>
      <p className="text-xs leading-relaxed mt-2 line-clamp-3 text-[var(--color-ink-soft)]">
        {story.content}
      </p>
      {story.date && (
        <span
          className="inline-block text-[10px] mt-3 font-medium px-2 py-0.5 rounded-full border"
          style={{
            background: 'var(--color-sunken)',
            borderColor: 'var(--color-line)',
            color: 'var(--color-ink-soft)',
          }}
        >
          {formatLocalDate(story.date, { showDayName: false })}
        </span>
      )}
    </motion.article>
  )
}

/* ────────────────────────────────────────────────────────
   Quick Access Cards — tanpa gradasi, token bersih
──────────────────────────────────────────────────────── */
const QUICK_CARDS = [
  {
    label: 'Kenangan',
    desc: 'Galeri foto & momen',
    href: (id: string) => `/room/${id}/memories`,
    Icon: ImageIcon,
    accentColor: 'var(--color-clay)',
    tintColor: 'var(--color-clay-tint)',
  },
  {
    label: 'Cerita',
    desc: 'Jurnal & kisah',
    href: (id: string) => `/room/${id}/stories`,
    Icon: BookOpen,
    accentColor: 'var(--color-sage)',
    tintColor: 'var(--color-sage-tint)',
  },
  {
    label: 'Rencana',
    desc: 'Agenda & jadwal',
    href: (id: string) => `/room/${id}/plans`,
    Icon: Calendar,
    accentColor: 'var(--color-honey)',
    tintColor: 'var(--color-sunken)',
  },
  {
    label: 'Kalender',
    desc: 'Ulang tahun & momen',
    href: (id: string) => `/room/${id}/calendar`,
    Icon: Gift,
    accentColor: 'var(--color-heart)',
    tintColor: 'var(--color-heart-tint)',
  },
]

/* ────────────────────────────────────────────────────────
   Dashboard Page
──────────────────────────────────────────────────────── */
export default function RoomDashboardPage() {
  const params = useParams<{ roomId: string }>()
  const { session } = useSession()

  const [membersCount, setMembersCount]     = useState(1)
  const [recentMemories, setRecentMemories] = useState<Memory[]>([])
  const [recentStories, setRecentStories]   = useState<Story[]>([])
  const [nextEvent, setNextEvent]           = useState<{
    title: string
    dateStr: string
    daysLeft: number
    isToday: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!params.roomId) return
    setLoading(true)
    try {
      const roomId = params.roomId

      // Members
      const membersSnap = await getDocs(collection(db, 'rooms', roomId, 'members'))
      setMembersCount(membersSnap.size || 1)

      // Next Important Event
      try {
        const datesSnap = await getDocs(collection(db, 'rooms', roomId, 'important_dates'))
        if (!datesSnap.empty) {
          const list = datesSnap.docs.map(d => ({ id: d.id, ...d.data() } as ImportantDate))
          const withInfo = list.map(item => {
            const info = item.recurring
              ? getNextRecurringOccurrence(item.date)
              : {
                  nextDateStr: item.date,
                  daysLeft: Math.max(0, Math.round(
                    (new Date(item.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  )),
                  isToday: false,
                }
            return { title: item.title, dateStr: item.date, ...info }
          })
          withInfo.sort((a, b) => a.daysLeft - b.daysLeft)
          if (withInfo[0]) setNextEvent(withInfo[0])
        }
      } catch {
        // silent
      }

      // Memories (up to 50 for rich photo pool)
      try {
        const memQ = query(
          collection(db, 'rooms', roomId, 'memories'),
          orderBy('date', 'desc'),
          limit(50)
        )
        const memSnap = await getDocs(memQ)
        setRecentMemories(memSnap.docs.map(d => ({ id: d.id, ...d.data() } as Memory)))
      } catch {
        const memSnap = await getDocs(collection(db, 'rooms', roomId, 'memories'))
        const list = memSnap.docs.map(d => ({ id: d.id, ...d.data() } as Memory))
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
        setRecentStories(stSnap.docs.map(d => ({ id: d.id, ...d.data() } as Story)))
      } catch {
        const stSnap = await getDocs(collection(db, 'rooms', roomId, 'stories'))
        const list = stSnap.docs.map(d => ({ id: d.id, ...d.data() } as Story))
        list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
        setRecentStories(list.slice(0, 4))
      }
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }, [params.roomId])

  useEffect(() => { loadData() }, [loadData])

  const roomName  = session?.room?.name || 'Tempat Kenangan Kita'
  const roomId    = params.roomId
  const totalPhotos = recentMemories.reduce((sum, m) => sum + (m.photos?.length ?? 0), 0)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-7 select-none">

      {/* ── Hero Card ── */}
      {loading ? (
        <div className="h-56 skeleton rounded-3xl" />
      ) : (
        <HeroCard
          roomName={roomName}
          membersCount={membersCount}
          memoriesCount={recentMemories.length}
          photosCount={totalPhotos}
          createdAt={session?.room?.created_at}
        />
      )}

      {/* ── Milestone Banner (Honey hanya untuk momen spesial) ── */}
      {!loading && nextEvent && (
        <Link
          href={`/room/${roomId}/calendar`}
          className="p-4 rounded-2xl flex items-center justify-between gap-3 border transition-colors cursor-pointer"
          style={{
            background: nextEvent.isToday ? 'var(--color-honey)' : 'var(--color-sunken)',
            borderColor: nextEvent.isToday ? 'var(--color-honey-line)' : 'var(--color-line)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-line)',
              }}
            >
              <Gift className="w-5 h-5 text-[var(--color-clay)]" />
            </div>
            <div className="truncate">
              <span
                className="text-xs font-semibold block"
                style={{ color: nextEvent.isToday ? 'var(--color-ink)' : 'var(--color-ink-soft)' }}
              >
                {nextEvent.isToday ? 'Momen spesial hari ini' : 'Peringatan terdekat'}
              </span>
              <h4
                className="text-sm font-bold truncate"
                style={{ color: 'var(--color-ink)' }}
              >
                {nextEvent.title}
              </h4>
            </div>
          </div>
          <span
            className="text-xs font-bold px-3 py-1 rounded-full shrink-0 border"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-line)',
              color: 'var(--color-ink)',
            }}
          >
            {nextEvent.isToday ? 'Hari Ini! 🎂' : `${nextEvent.daysLeft} hari lagi`}
          </span>
        </Link>
      )}

      {/* ── Quick Access Cards ── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 select-none">
        {QUICK_CARDS.map(({ label, desc, href, Icon, accentColor, tintColor }) => (
          <Link
            key={label}
            href={href(roomId)}
            className="group p-4 rounded-2xl flex flex-col items-center text-center gap-2.5 border transition-colors hover:shadow-md"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-line)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border"
              style={{
                background: tintColor,
                borderColor: 'var(--color-line)',
              }}
            >
              <Icon className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--color-ink)]">{label}</p>
              <p className="text-[11px] text-[var(--color-ink-soft)]">{desc}</p>
            </div>
          </Link>
        ))}
      </section>

      {/* ── Photo Marquee ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-base font-bold text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Kenangan Terbaru
          </h2>
          <Link
            href={`/room/${roomId}/memories`}
            className="text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-clay)' }}
          >
            Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="h-44 skeleton rounded-2xl" />
        ) : (
          <PhotoMarquee memories={recentMemories} roomId={roomId} />
        )}
      </section>

      {/* ── Recent Stories ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-base font-bold text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Cerita Terbaru
          </h2>
          <Link
            href={`/room/${roomId}/stories`}
            className="text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-clay)' }}
          >
            Tulis Cerita <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-20 skeleton rounded-2xl" />
            <div className="h-20 skeleton rounded-2xl" />
          </div>
        ) : recentStories.length === 0 ? (
          <div
            className="rounded-2xl border-2 border-dashed py-10 text-center space-y-3"
            style={{ borderColor: 'var(--color-line)', background: 'var(--color-surface)' }}
          >
            <div
              className="w-12 h-12 rounded-full mx-auto flex items-center justify-center border"
              style={{ background: 'var(--color-sunken)', borderColor: 'var(--color-line)' }}
            >
              <BookOpen className="w-5 h-5 text-[var(--color-sage-deep)]" />
            </div>
            <p className="text-sm font-semibold text-[var(--color-ink-soft)]">
              Belum ada cerita yang ditulis
            </p>
            <Link
              href={`/room/${roomId}/stories`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold hover:opacity-90 transition-opacity text-[var(--color-white)]"
              style={{ background: 'var(--color-clay)' }}
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


