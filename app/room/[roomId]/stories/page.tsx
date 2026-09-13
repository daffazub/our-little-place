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
import JoyDatePicker from '@/components/ui/JoyDatePicker'
import PageHeaderCard from '@/components/ui/PageHeaderCard'
import type { Story } from '@/types/database'

export default function StoriesPage() {
  const params = useParams<{ roomId: string }>()
  const { session } = useSession()

  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
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
          bg: 'var(--joy-green-light)',
          textColor: '#1b4d3e',
          borderColor: 'rgba(168, 213, 186, 0.5)',
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
          gradient: 'var(--gradient-story)',
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
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
            style={{ background: 'var(--joy-green-light)' }}
          >
            <BookOpen className="w-9 h-9" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Belum ada cerita yang ditulis
            </h3>
            <p className="text-xs mt-1 max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
              Setiap momen punya kisahnya sendiri. Mulai tuangkan perasaan atau kisah seru kalian di sini.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
            style={{ background: 'var(--gradient-story)', color: 'var(--joy-charcoal)' }}
          >
            <Plus className="w-4 h-4" /> Tulis Cerita Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {stories.map((story, index) => (
            <article
              key={story.id}
              className="group rounded-3xl p-6 transition-all duration-300 hover:-translate-y-0.5 space-y-3 animate-fade-in-up relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(205, 231, 208, 0.45) 0%, rgba(207, 232, 243, 0.5) 100%)',
                border: '1.5px solid rgba(168, 213, 186, 0.6)',
                boxShadow: '0 8px 24px -4px rgba(168, 213, 186, 0.25), 0 2px 6px rgba(0,0,0,0.02)',
                animationDelay: `${index * 0.07}s`,
              }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold px-3 py-1 rounded-full bg-white/70 text-[#2d6a4a] shadow-xs">
                  <Calendar className="w-3.5 h-3.5 text-[var(--joy-green)]" />
                  {story.date}
                </span>
                <Quote className="w-5 h-5 text-[#2d6a4a]/30 group-hover:text-[#2d6a4a]/60 transition-colors" />
              </div>

              <h2
                className="text-lg font-bold leading-snug"
                style={{ color: 'var(--joy-charcoal)', fontFamily: 'var(--font-heading)' }}
              >
                {story.title}
              </h2>

              <p className="text-sm whitespace-pre-line leading-relaxed text-[#374151]">
                {story.content}
              </p>
            </article>
          ))}
        </div>
      )}

      {/* Modal Tulis Cerita */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            style={{
              background: '#FFFFFF',
              border: '1.5px solid rgba(168, 213, 186, 0.6)',
              boxShadow: '0 20px 50px -10px rgba(168, 213, 186, 0.35)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
                  style={{ background: 'var(--gradient-story)' }}
                >
                  <BookOpen className="w-5 h-5 text-[var(--joy-charcoal)]" />
                </div>
                <div>
                  <h2
                    className="text-base font-bold leading-tight text-[var(--joy-charcoal)]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Tulis Cerita Baru
                  </h2>
                  <p className="text-[11px] text-[var(--text-secondary)]">Ungkapkan rasa dan kisah perjalanan bersama</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-[var(--danger-tint)] text-[var(--danger-text)] text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateStory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
                  Judul Cerita <span className="text-[#e05252]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => {
                    setTitle(e.target.value)
                    if (storyErrors.title) setStoryErrors(p => ({ ...p, title: undefined }))
                  }}
                  placeholder="Contoh: Hari Pertama Berkemah di Hutan..."
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-xs text-[var(--text-primary)] outline-none transition-all ${
                    storyErrors.title
                      ? 'bg-red-50/30 border border-[#e05252] focus:border-[#e05252] focus:ring-2 focus:ring-[#e05252]/20'
                      : 'bg-[var(--surface-elevated)] border border-[var(--border)] focus:border-[var(--joy-green)] focus:ring-2 focus:ring-[var(--joy-green)]/40'
                  }`}
                />
                {storyErrors.title && (
                  <p className="mt-1.5 text-[11px] text-[#e05252] font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{storyErrors.title}</span>
                  </p>
                )}
              </div>

              <div>
                <JoyDatePicker
                  label="Tanggal Cerita *"
                  value={date}
                  onChange={newDate => {
                    setDate(newDate)
                    if (storyErrors.date) setStoryErrors(p => ({ ...p, date: undefined }))
                  }}
                />
                {storyErrors.date && (
                  <p className="mt-1.5 text-[11px] text-[#e05252] font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{storyErrors.date}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
                  Isi Cerita <span className="text-[#e05252]">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={e => {
                    setContent(e.target.value)
                    if (storyErrors.content) setStoryErrors(p => ({ ...p, content: undefined }))
                  }}
                  rows={6}
                  placeholder="Tuliskan kisah, perasaan, atau kejadian berharga yang kalian lalui bersama..."
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-xs text-[var(--text-primary)] outline-none transition-all resize-none ${
                    storyErrors.content
                      ? 'bg-red-50/30 border border-[#e05252] focus:border-[#e05252] focus:ring-2 focus:ring-[#e05252]/20'
                      : 'bg-[var(--surface-elevated)] border border-[var(--border)] focus:border-[var(--joy-green)] focus:ring-2 focus:ring-[var(--joy-green)]/40'
                  }`}
                />
                {storyErrors.content && (
                  <p className="mt-1.5 text-[11px] text-[#e05252] font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{storyErrors.content}</span>
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer hover:opacity-95 shadow-sm"
                  style={{
                    background: 'var(--gradient-story)',
                    color: 'var(--joy-charcoal)',
                    boxShadow: '0 4px 14px rgba(168, 213, 186, 0.35)',
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
