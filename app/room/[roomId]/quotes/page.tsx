'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Quote as QuoteIcon, Plus, Heart, Calendar, User, X, Loader2 } from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import { supabase } from '@/lib/supabase/client'
import type { Quote } from '@/types/database'

export default function QuotesPage() {
  const params = useParams<{ roomId: string }>()
  const { session } = useSession()

  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  // Form state
  const [text, setText] = useState('')
  const [saidBy, setSaidBy] = useState('')
  const [context, setContext] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadQuotes = async () => {
    if (!params.roomId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*, quote_likes(*)')
        .eq('room_id', params.roomId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setQuotes(data as Quote[])
      }
    } catch (err) {
      console.error('Failed to load quotes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuotes()
  }, [params.roomId])

  const handleToggleLike = async (quoteId: string) => {
    if (!session) return
    try {
      const current = quotes.find(q => q.id === quoteId)
      const liked = (current as any)?.quote_likes?.some((l: any) => l.member_id === session.id)

      if (liked) {
        await supabase
          .from('quote_likes')
          .delete()
          .eq('quote_id', quoteId)
          .eq('member_id', session.id)
      } else {
        await supabase.from('quote_likes').insert({
          quote_id: quoteId,
          member_id: session.id,
        })
      }
      loadQuotes()
    } catch (err) {
      console.error('Failed to toggle like on quote:', err)
    }
  }

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !saidBy.trim()) {
      setError('Kutipan dan nama pengucap wajib diisi.')
      return
    }
    if (!session) return

    setSubmitting(true)
    setError('')

    try {
      const { error: insertError } = await supabase.from('quotes').insert({
        room_id: params.roomId,
        text: text.trim(),
        said_by: saidBy.trim(),
        context: context.trim() || null,
        created_by: session.id,
      })

      if (insertError) throw new Error(insertError.message)

      setText('')
      setSaidBy('')
      setContext('')
      setShowAddModal(false)
      loadQuotes()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan quote.')
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
            <QuoteIcon className="w-6 h-6 text-[var(--favorite)]" />
            Quotes & Inside Jokes
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Kata-kata kocak, celetukan absurd, atau kalimat bijak yang selalu kita ingat.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-bold hover:bg-[var(--accent-hover)] transition-all active:scale-95 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Quote
        </button>
      </div>

      {/* Quotes List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-36 skeleton rounded-3xl" />
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-3xl space-y-3">
          <QuoteIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Belum ada quote yang dicatat</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            Catat candaan khas atau kata-kata ikonik teman kamu sekarang!
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-bold hover:bg-[var(--accent-hover)] transition-all"
          >
            <Plus className="w-4 h-4" /> Tambah Quote
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quotes.map(quote => {
            const likes = (quote as any).quote_likes || []
            const isLiked = likes.some((l: any) => l.member_id === session?.id)

            return (
              <div
                key={quote.id}
                className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-5 shadow-sm hover:border-[var(--accent-border)] transition-all flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <QuoteIcon className="w-6 h-6 text-[var(--favorite-tint)] group-hover:text-[var(--favorite)] transition-colors mb-2" />
                  <p className="text-sm font-bold text-[var(--text-primary)] italic leading-relaxed">
                    &ldquo;{quote.text}&rdquo;
                  </p>
                  {quote.context && (
                    <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-snug">
                      ({quote.context})
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--accent-text)]">
                    — {quote.said_by}
                  </span>

                  <button
                    onClick={() => handleToggleLike(quote.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all ${
                      isLiked
                        ? 'bg-[var(--favorite-tint)] text-[var(--favorite)] font-bold'
                        : 'text-[var(--text-muted)] hover:bg-[var(--surface-elevated)]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{likes.length}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Tambah Quote */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[var(--accent-text)]" />
                Tambah Quote Baru
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

            <form onSubmit={handleCreateQuote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wide">
                  Kata-Kata / Quote *
                </label>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  rows={3}
                  placeholder="Ketik kutipan atau kata-kata lucu di sini..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-border)] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wide">
                  Diucapkan Oleh *
                </label>
                <input
                  type="text"
                  value={saidBy}
                  onChange={e => setSaidBy(e.target.value)}
                  placeholder="Contoh: Sarah, Rian, atau Seluruh Circle"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-border)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wide">
                  Konteks Situasi (Opsional)
                </label>
                <input
                  type="text"
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  placeholder="Contoh: Pas lagi kesasar di jalan tol, jam 2 pagi..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-border)]"
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
                    'Simpan Quote'
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
