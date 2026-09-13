'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Calendar as CalendarIcon, Plus, Gift, X, Loader2 } from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import type { ImportantDate } from '@/types/database'

export default function CalendarPage() {
  const params = useParams<{ roomId: string }>()
  const { session } = useSession()

  const [dates, setDates] = useState<ImportantDate[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [recurring, setRecurring] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadDates = async () => {
    if (!params.roomId) return
    setLoading(true)
    try {
      const roomId = params.roomId
      const datesRef = collection(db, 'rooms', roomId, 'important_dates')
      let list: ImportantDate[] = []

      try {
        const q = query(datesRef, orderBy('date', 'asc'))
        const snap = await getDocs(q)
        list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ImportantDate))
      } catch {
        const snap = await getDocs(datesRef)
        list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ImportantDate))
        list.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      }

      setDates(list)
    } catch (err) {
      console.error('Failed to load important dates:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDates()
  }, [params.roomId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Nama momen / peringatan wajib diisi.')
      return
    }
    if (!session || !params.roomId) return

    setSubmitting(true)
    setError('')

    try {
      await addDoc(collection(db, 'rooms', params.roomId, 'important_dates'), {
        room_id: params.roomId,
        title: title.trim(),
        date,
        recurring,
        created_by: session.id,
        created_at: new Date().toISOString(),
      })

      setTitle('')
      setShowAddModal(false)
      loadDates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan tanggal penting.')
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
            <CalendarIcon className="w-6 h-6 text-[var(--accent-text)]" />
            Kalender & Tanggal Penting
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Ulang tahun, anniversary pertemanan, dan hari-hari istimewa yang wajib kita rayakan.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-bold hover:bg-[var(--accent-hover)] transition-all active:scale-95 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Tanggal Penting
        </button>
      </div>

      {/* Dates List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 skeleton rounded-2xl" />
          ))}
        </div>
      ) : dates.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-3xl space-y-3">
          <Gift className="w-12 h-12 text-[var(--text-muted)] mx-auto" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Belum ada tanggal penting</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            Catat ulang tahun sahabatmu atau hari jadian pertemanan kalian!
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-bold hover:bg-[var(--accent-hover)] transition-all"
          >
            <Plus className="w-4 h-4" /> Catat Tanggal Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dates.map(item => (
            <div
              key={item.id}
              className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-4 shadow-sm flex items-start gap-3.5 hover:border-[var(--accent-border)] transition-all"
            >
              <div className="w-10 h-10 rounded-2xl bg-[var(--accent-tint)] text-[var(--accent-text)] flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">
                  {item.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {new Date(item.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
                {item.recurring && (
                  <span className="inline-block mt-2 text-[10px] font-semibold text-[var(--accent-text)] bg-[var(--accent-tint)] px-2 py-0.5 rounded-md">
                    Berulang Setiap Tahun 🎂
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Tanggal Penting */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[var(--accent-text)]" />
                Tambah Tanggal Spesial
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

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wide">
                  Nama Peringatan / Acara *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Contoh: Ulang Tahun Daffa, Hari Jadi Circle"
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

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={recurring}
                  onChange={e => setRecurring(e.target.checked)}
                  className="rounded text-[var(--accent)] focus:ring-0"
                />
                <label htmlFor="recurring" className="text-xs text-[var(--text-primary)] font-medium">
                  Berulang setiap tahun (Tahunan)
                </label>
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
                    'Simpan Tanggal'
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
