'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { BookOpen, Plus, Calendar, User, X, Loader2 } from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import { supabase } from '@/lib/supabase/client'
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

  const loadStories = async () => {
    if (!params.roomId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('room_id', params.roomId)
        .order('date', { ascending: false })

      if (!error && data) {
        setStories(data as Story[])
      }
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
    if (!title.trim() || !content.trim()) {
      setError('Judul dan isi cerita tidak boleh kosong.')
      return
    }
    if (!session) return

    setSubmitting(true)
    setError('')

    try {
      const { error: insertError } = await supabase.from('stories').insert({
        room_id: params.roomId,
        title: title.trim(),
        content: content.trim(),
        date,
        created_by: session.id,
      })

      if (insertError) throw new Error(insertError.message)

      setTitle('')
      setContent('')
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[var(--warm)]" />
            Cerita & Jurnal Bersama
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Kisah perjalanan, suka duka, dan surat-surat kecil yang tak ingin kita lupakan.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-bold hover:bg-[var(--accent-hover)] transition-all active:scale-95 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tulis Cerita Baru
        </button>
      </div>

      {/* Stories Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 skeleton rounded-3xl" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-3xl space-y-3">
          <BookOpen className="w-12 h-12 text-[var(--text-muted)] mx-auto" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Belum ada cerita yang ditulis</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            Mulailah menulis kisah pertama tentang persahabatan kalian di sini.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-bold hover:bg-[var(--accent-hover)] transition-all"
          >
            <Plus className="w-4 h-4" /> Mulai Menulis
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {stories.map(story => (
            <article
              key={story.id}
              className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 shadow-sm hover:shadow-md transition-shadow space-y-4"
            >
              <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <Calendar className="w-3.5 h-3.5" />
                  {story.date}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--warm-tint)] text-[var(--warm-text)] text-[10px] font-bold">
                  Kisah Kita
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)] leading-tight">
                  {story.title}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2.5 whitespace-pre-line leading-relaxed font-serif">
                  {story.content}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal Tulis Cerita */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[var(--accent-text)]" />
                Tulis Cerita Baru
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-[var(--danger-tint)] text-[var(--danger-text)] text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateStory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wide">
                  Judul Cerita *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Contoh: Malam Tak Terlupakan di Puncak"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-border)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wide">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-border)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wide">
                  Isi Cerita *
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={8}
                  placeholder="Tuangkan semua cerita, detail lucu, atau pesan menyentuh hati di sini..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-border)] resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-bold hover:bg-[var(--accent-hover)] transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Publikasikan Cerita'
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
