'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Calendar as CalendarIcon, Plus, Gift, X, Loader2, Sparkles, Heart } from 'lucide-react'
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
import { AlertCircle } from 'lucide-react'
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
  const [calendarErrors, setCalendarErrors] = useState<{ title?: string; date?: string }>({})

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
    const errs: { title?: string; date?: string } = {}
    if (!title.trim()) {
      errs.title = 'Nama momen / peringatan wajib diisi'
    }
    if (!date.trim()) {
      errs.date = 'Tanggal peringatan wajib dipilih'
    }
    if (Object.keys(errs).length > 0) {
      setCalendarErrors(errs)
      return
    }
    if (!session || !params.roomId) return

    setSubmitting(true)
    setError('')
    setCalendarErrors({})

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
      {/* 2-Card Pattern: Page Header Card */}
      <PageHeaderCard
        badge={{
          text: 'Momen & Hari Spesial',
          icon: Sparkles,
        }}
        title="🎂 Kalender & Tanggal Penting"
        description="Ulang tahun, anniversary pertemanan, dan hari-hari istimewa yang wajib kita rayakan."
        cta={{
          label: 'Tambah Tanggal Penting',
          icon: Plus,
          onClick: () => {
            setCalendarErrors({})
            setShowAddModal(true)
          },
          gradient: 'var(--gradient-date)',
          textColor: 'var(--joy-charcoal)',
        }}
      />

      {/* Dates List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 skeleton rounded-2xl" />
          ))}
        </div>
      ) : dates.length === 0 ? (
        <div
          className="text-center py-16 px-4 border-2 border-dashed rounded-3xl space-y-4"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
            style={{ background: 'var(--joy-peach-light)' }}
          >
            <Gift className="w-9 h-9" style={{ color: 'var(--joy-peach)' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Belum ada tanggal penting
            </h3>
            <p className="text-xs mt-1 max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
              Catat ulang tahun sahabatmu atau hari jadian pertemanan kalian!
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
            style={{ background: 'var(--gradient-date)', color: 'var(--joy-charcoal)' }}
          >
            <Plus className="w-4 h-4" /> Catat Tanggal Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dates.map(item => (
            <div
              key={item.id}
              className="group rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex"
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDF9 100%)',
                border: '1.5px solid rgba(255, 180, 162, 0.45)',
                boxShadow: '0 8px 24px -4px rgba(255, 180, 162, 0.18), 0 2px 6px rgba(0,0,0,0.02)',
              }}
            >
              {/* Gradient left accent bar */}
              <div className="w-2 shrink-0" style={{ background: 'var(--gradient-date)' }} />

              <div className="flex-1 p-5 flex items-start gap-3.5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform"
                  style={{ background: 'var(--joy-peach-light)' }}
                >
                  <Gift className="w-6 h-6" style={{ color: 'var(--joy-peach)' }} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold truncate text-[var(--joy-charcoal)]">
                    {item.title}
                  </h3>
                  <p className="text-xs mt-1 text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-[var(--joy-peach)]" />
                    {new Date(item.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                  {item.recurring && (
                    <span
                      className="inline-flex items-center gap-1 mt-2.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs"
                      style={{ background: 'var(--joy-yellow-light)', color: 'var(--joy-charcoal)' }}
                    >
                      <Sparkles className="w-3 h-3 text-[var(--joy-peach)]" />
                      Berulang Tiap Tahun 🎂
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Tanggal Penting */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            style={{
              background: '#FFFFFF',
              border: '1.5px solid rgba(255, 180, 162, 0.6)',
              boxShadow: '0 20px 50px -10px rgba(255, 180, 162, 0.35)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
                  style={{ background: 'var(--gradient-date)' }}
                >
                  <Gift className="w-5 h-5 text-[var(--joy-charcoal)]" />
                </div>
                <div>
                  <h2
                    className="text-base font-bold leading-tight text-[var(--joy-charcoal)]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Tambah Tanggal Spesial
                  </h2>
                  <p className="text-[11px] text-[var(--text-secondary)]">Ulang tahun atau hari peringatan kalian</p>
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

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
                  Nama Peringatan / Acara <span className="text-[#e05252]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => {
                    setTitle(e.target.value)
                    if (calendarErrors.title) setCalendarErrors(prev => ({ ...prev, title: undefined }))
                  }}
                  placeholder="Contoh: Ulang Tahun Daffa, Hari Jadi Circle"
                  className={`w-full px-3.5 py-2.5 rounded-2xl bg-[var(--surface-elevated)] border text-xs text-[var(--text-primary)] outline-none focus:ring-2 transition-all ${
                    calendarErrors.title
                      ? 'border-[#e05252] focus:ring-[#e05252]/20'
                      : 'border-[var(--border)] focus:border-[var(--joy-peach)] focus:ring-[var(--joy-yellow)]/40'
                  }`}
                />
                {calendarErrors.title && (
                  <p className="flex items-center gap-1.5 text-xs text-[#e05252] mt-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {calendarErrors.title}
                  </p>
                )}
              </div>

              <div>
                <JoyDatePicker
                  label="Tanggal Peringatan *"
                  value={date}
                  onChange={newDate => {
                    setDate(newDate)
                    if (calendarErrors.date) setCalendarErrors(prev => ({ ...prev, date: undefined }))
                  }}
                />
                {calendarErrors.date && (
                  <p className="flex items-center gap-1.5 text-xs text-[#e05252] mt-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {calendarErrors.date}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={recurring}
                  onChange={e => setRecurring(e.target.checked)}
                  className="w-4 h-4 rounded-md accent-[var(--joy-peach)] cursor-pointer"
                />
                <label htmlFor="recurring" className="text-xs text-[var(--text-secondary)] cursor-pointer select-none">
                  Ulangi peringatan ini setiap tahun (Ulang Tahun / Anniversary)
                </label>
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
                    background: 'var(--gradient-date)',
                    color: 'var(--joy-charcoal)',
                    boxShadow: '0 4px 14px rgba(255, 180, 162, 0.4)',
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
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
