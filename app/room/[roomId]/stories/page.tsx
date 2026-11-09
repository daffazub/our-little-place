'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { BookOpen, Plus, Calendar, X, Loader2, Sparkles, Quote, AlertCircle } from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import DatePicker from '@/components/ui/DatePicker'
import PageHeaderCard from '@/components/ui/PageHeaderCard'
import type { Story } from '@/types'
import { getLocalDateString, formatLocalDate } from '@/lib/utils/date'
import { Button as DSButton } from '@/components/ui/Button'
import { Input as DSInput } from '@/components/ui/Input'
import { Textarea as DSTextarea } from '@/components/ui/Textarea'

export default function StoriesPage() {
  const params = useParams<{ roomId: string }>()
  const { session } = useSession()

  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [date, setDate] = useState(getLocalDateString())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [storyErrors, setStoryErrors] = useState<{ title?: string; content?: string; date?: string }>({})

  const loadStories = async () => {
    if (!params.roomId) return
    setLoading(true)
    try {
      const roomId = params.roomId
      const storiesRef = collection(db, 'rooms', roomId, 'stories')
      let list: Story[] = []

      try {
        const q = query(storiesRef, orderBy('date', 'desc'))
        const snap = await getDocs(q)
        list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Story))
      } catch {
        const snap = await getDocs(storiesRef)
        list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Story))
        list.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      }

      setStories(list)
    } catch (err) {
      console.error('Failed to load stories:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStories()
  }, [params.roomId])

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault()

    const errs: { title?: string; content?: string; date?: string } = {}
    if (!title.trim()) errs.title = 'Judul cerita wajib diisi'
    if (!content.trim()) errs.content = 'Isi cerita tidak boleh kosong'
    if (!date.trim()) errs.date = 'Tanggal cerita wajib dipilih'

    if (Object.keys(errs).length > 0) {
      setStoryErrors(errs)
      return
    }
    if (!session || !params.roomId) return

    setStoryErrors({})
    setSubmitting(true)
    setError('')

    try {
      await addDoc(collection(db, 'rooms', params.roomId, 'stories'), {
        room_id: params.roomId,
        title: title.trim(),
        content: content.trim(),
        date,
        created_by: session.id,
        created_at: new Date().toISOString(),
      })

      setTitle('')
      setContent('')
      setStoryErrors({})
      setShowAddModal(false)
      loadStories()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan cerita.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* ── Page Header Card (Reusable, Spacing 12-16px, Padding 24-28px) ── */}
      <PageHeaderCard
        badge={{
          text: 'Jurnal Hati Sahabat',
          icon: Sparkles,
        }}
        title="📖 Cerita & Jurnal Bersama"
        description="Kisah perjalanan, suka duka, dan surat-surat kecil yang tak ingin kita lupakan."
        cta={{
          label: 'Tulis Cerita Baru',
          icon: Plus,
          onClick: () => {
            setStoryErrors({})
            setError('')
            setShowAddModal(true)
          },
        }}
      />

      {/* Stories List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 skeleton rounded-3xl" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div
          className="text-center py-16 px-4 border-2 border-dashed rounded-3xl space-y-4"
          style={{ borderColor: 'var(--color-line)', background: 'var(--color-surface)' }}
        >
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center border"
            style={{ background: 'var(--color-sunken)', borderColor: 'var(--color-line)' }}
          >
            <BookOpen className="w-9 h-9 text-[var(--color-sage-deep)]" />
          </div>
          <div>
            <h3
              className="text-sm font-bold text-[var(--color-ink)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Belum ada cerita yang ditulis
            </h3>
            <p className="text-xs mt-1 max-w-xs mx-auto text-[var(--color-ink-soft)]">
              Setiap momen punya kisahnya sendiri. Mulai tuangkan perasaan atau kisah seru kalian di sini.
            </p>
          </div>
            <DSButton
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold hover:opacity-90 transition-opacity text-[var(--color-white)]"
            style={{ background: 'var(--color-clay)' }}
          >
            <Plus className="w-4 h-4" /> Tulis Cerita Pertama
            </DSButton>
        </div>
      ) : (
        <div className="space-y-4">
          {stories.map((story, index) => (
            <article
              key={story.id}
              className="group rounded-3xl p-6 transition-colors duration-300 space-y-3 animate-fade-in-up relative overflow-hidden border"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-line)',
                boxShadow: 'var(--shadow-card)',
                animationDelay: `${index * 0.07}s`,
              }}
            >
              {/* Garis aksen kiri gaya jurnal */}
              <div
                className="absolute left-0 top-6 bottom-6 w-0.5 rounded-full"
                style={{ background: 'var(--color-sage)' }}
              />

              <div className="flex items-center justify-between text-xs pl-3">
                <span
                  className="inline-flex items-center gap-1.5 font-semibold px-3 py-1 rounded-full border"
                  style={{
                    background: 'var(--color-sage-tint)',
                    borderColor: 'var(--color-sage)',
                    color: 'var(--color-sage-deep)',
                    opacity: 0.85,
                  }}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {formatLocalDate(story.date, { showDayName: true })}
                </span>
                <Quote className="w-5 h-5 text-[var(--color-line)] group-hover:text-[var(--color-ink-soft)] transition-colors" />
              </div>

              <h2
                className="text-lg font-bold leading-snug pl-3 text-[var(--color-ink)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {story.title}
              </h2>

              <p className="text-sm whitespace-pre-line leading-relaxed text-[var(--color-ink-soft)] pl-3">
                {story.content}
              </p>
            </article>
          ))}
        </div>
      )}

      {/* Modal Tulis Cerita */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)] backdrop-blur-xs animate-in fade-in">
          <div
            className="rounded-3xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto border"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-line)',
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            <div
              className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: 'var(--color-line)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center border"
                  style={{ background: 'var(--color-sage-tint)', borderColor: 'var(--color-line)' }}
                >
                  <BookOpen className="w-5 h-5 text-[var(--color-sage-deep)]" />
                </div>
                <div>
                  <h2
                    className="text-base font-bold leading-tight text-[var(--color-ink)]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Tulis Cerita Baru
                  </h2>
                  <p className="text-[11px] text-[var(--color-ink-soft)]">Ungkapkan rasa dan kisah perjalanan bersama</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-sunken)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div
                className="p-3 rounded-2xl text-xs font-semibold border"
                style={{
                  background: 'var(--color-danger-tint)',
                  color: 'var(--color-error)',
                  borderColor: 'var(--color-error)',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleCreateStory} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--color-ink-soft)] mb-1.5">
                  Judul Cerita <span className="text-[var(--color-error)]">*</span>
                </label>
                <DSInput
                  type="text"
                  value={title}
                  onChange={e => {
                    setTitle(e.target.value)
                    if (storyErrors.title) setStoryErrors(p => ({ ...p, title: undefined }))
                  }}
                  placeholder="Contoh: Hari Pertama Berkemah di Hutan..."
                  className="w-full px-3.5 py-2.5 rounded-2xl text-xs outline-none transition-colors"
                  style={{
                    background: 'var(--color-sunken)',
                    border: storyErrors.title
                      ? '1.5px solid var(--color-error)'
                      : '1.5px solid var(--color-line)',
                    color: 'var(--color-ink)',
                  }}
                />
                {storyErrors.title && (
                  <p className="mt-1.5 text-[11px] font-medium flex items-center gap-1" style={{ color: 'var(--color-error)' }}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{storyErrors.title}</span>
                  </p>
                )}
              </div>

              <div>
                <DatePicker
                  label="Tanggal Cerita *"
                  value={date}
                  onChange={newDate => {
                    setDate(newDate)
                    if (storyErrors.date) setStoryErrors(p => ({ ...p, date: undefined }))
                  }}
                />
                {storyErrors.date && (
                  <p className="mt-1.5 text-[11px] font-medium flex items-center gap-1" style={{ color: 'var(--color-error)' }}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{storyErrors.date}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--color-ink-soft)] mb-1.5">
                  Isi Cerita <span className="text-[var(--color-error)]">*</span>
                </label>
                <DSTextarea
                  value={content}
                  onChange={e => {
                    setContent(e.target.value)
                    if (storyErrors.content) setStoryErrors(p => ({ ...p, content: undefined }))
                  }}
                  rows={6}
                  placeholder="Tuliskan kisah, perasaan, atau kejadian berharga yang kalian lalui bersama..."
                  className="w-full px-3.5 py-2.5 rounded-2xl text-xs outline-none transition-colors resize-none"
                  style={{
                    background: 'var(--color-sunken)',
                    border: storyErrors.content
                      ? '1.5px solid var(--color-error)'
                      : '1.5px solid var(--color-line)',
                    color: 'var(--color-ink)',
                  }}
                />
                {storyErrors.content && (
                  <p className="mt-1.5 text-[11px] font-medium flex items-center gap-1" style={{ color: 'var(--color-error)' }}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{storyErrors.content}</span>
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-semibold transition-colors cursor-pointer hover:bg-[var(--color-sunken)]"
                  style={{ color: 'var(--color-ink-soft)' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-full text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-60 cursor-pointer hover:opacity-95 text-[var(--color-white)]"
                  style={{
                    background: 'var(--color-clay)',
                    border: '1px solid var(--color-clay-deep)',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Cerita'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

