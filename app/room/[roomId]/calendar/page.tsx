'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Calendar as CalendarIcon, Plus, Gift, X, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import {
  collection,
  addDoc,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import DatePicker from '@/components/ui/DatePicker'
import PageHeaderCard from '@/components/ui/PageHeaderCard'
import type { ImportantDate } from '@/types'
import { getLocalDateString, formatLocalDate, getNextRecurringOccurrence } from '@/lib/utils/date'
import { Button as DSButton } from '@/components/ui/Button'
import { Input as DSInput } from '@/components/ui/Input'

export default function CalendarPage() {
  const params = useParams<{ roomId: string }>()
  const { session } = useSession()

  const [dates, setDates]           = useState<ImportantDate[]>([])
  const [loading, setLoading]       = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  // Form state
  const [title, setTitle]           = useState('')
  const [date, setDate]             = useState(getLocalDateString())
  const [recurring, setRecurring]   = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [calendarErrors, setCalendarErrors] = useState<{ title?: string; date?: string }>({})

  const loadDates = async () => {
    if (!params.roomId) return
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'rooms', params.roomId, 'important_dates'))
      const list: ImportantDate[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as ImportantDate))
      list.sort((a, b) => {
        const aDays = a.recurring
          ? getNextRecurringOccurrence(a.date).daysLeft
          : Math.max(0, Math.round((new Date(a.date).getTime() - Date.now()) / 86400000))
        const bDays = b.recurring
          ? getNextRecurringOccurrence(b.date).daysLeft
          : Math.max(0, Math.round((new Date(b.date).getTime() - Date.now()) / 86400000))
        return aDays - bDays
      })
      setDates(list)
    } catch (err) {
      console.error('Failed to load important dates:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDates() }, [params.roomId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: { title?: string; date?: string } = {}
    if (!title.trim()) errs.title = 'Nama momen / peringatan wajib diisi'
    if (!date.trim())  errs.date  = 'Tanggal peringatan wajib dipilih'
    if (Object.keys(errs).length > 0) { setCalendarErrors(errs); return }
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

      {/* ── Page Header Card ── */}
      <PageHeaderCard
        badge={{ text: 'Momen & Hari Spesial', icon: Sparkles }}
        title="🎂 Kalender & Tanggal Penting"
        description="Ulang tahun, anniversary pertemanan, dan hari-hari istimewa yang wajib kita rayakan."
        cta={{
          label: 'Tambah Tanggal Penting',
          icon: Plus,
          onClick: () => { setCalendarErrors({}); setShowAddModal(true) },
        }}
      />

      {/* Dates List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}
        </div>
      ) : dates.length === 0 ? (
        <div
          className="text-center py-16 px-4 border-2 border-dashed rounded-3xl space-y-4"
          style={{ borderColor: 'var(--color-line)', background: 'var(--color-surface)' }}
        >
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center border"
            style={{ background: 'var(--color-sunken)', borderColor: 'var(--color-line)' }}
          >
            <Gift className="w-9 h-9 text-[var(--color-clay)]" />
          </div>
          <div>
            <h3
              className="text-sm font-bold text-[var(--color-ink)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Belum ada tanggal penting
            </h3>
            <p className="text-xs mt-1 max-w-xs mx-auto text-[var(--color-ink-soft)]">
              Catat ulang tahun sahabatmu atau hari jadi pertemanan kalian!
            </p>
          </div>
            <DSButton
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold hover:opacity-90 transition-opacity text-[var(--color-white)]"
            style={{ background: 'var(--color-clay)' }}
          >
            <Plus className="w-4 h-4" /> Catat Tanggal Sekarang
            </DSButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dates.map(item => {
            const info = item.recurring ? getNextRecurringOccurrence(item.date) : null
            const isToday = info?.isToday ?? false
            return (
              <div
                key={item.id}
                className="group rounded-2xl overflow-hidden transition-colors duration-300 hover:-translate-y-0.5 flex"
                style={{
                  background: isToday ? 'var(--color-honey)' : 'var(--color-surface)',
                  border: `1.5px solid ${isToday ? 'var(--color-honey-line)' : 'var(--color-line)'}`,
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                {/* Aksen kiri */}
                <div
                  className="w-1.5 shrink-0"
                  style={{ background: isToday ? 'var(--color-clay)' : 'var(--color-honey)' }}
                />

                <div className="flex-1 p-5 flex items-start gap-3.5">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border group-hover:scale-105 transition-transform"
                    style={{
                      background: isToday ? 'rgba(255,255,255,0.7)' : 'var(--color-sunken)',
                      borderColor: 'var(--color-line)',
                    }}
                  >
                    <Gift className="w-5 h-5 text-[var(--color-clay)]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-sm font-bold truncate"
                      style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-heading)' }}
                    >
                      {item.title}
                    </h3>
                    <p
                      className="text-xs mt-1 font-medium flex items-center gap-1.5"
                      style={{ color: 'var(--color-ink-soft)' }}
                    >
                      <CalendarIcon className="w-3.5 h-3.5 text-[var(--color-clay)]" />
                      {formatLocalDate(item.date, { showYear: !item.recurring })}
                    </p>
                    {item.recurring && info && (
                      <span
                        className="inline-flex items-center gap-1 mt-2.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border"
                        style={{
                          background: info.isToday ? 'rgba(255,255,255,0.8)' : 'var(--color-sunken)',
                          borderColor: 'var(--color-line)',
                          color: 'var(--color-ink)',
                        }}
                      >
                        <Sparkles className="w-3 h-3 text-[var(--color-clay)]" />
                        {info.isToday ? 'Hari ini! 🎂' : `${info.daysLeft} hari lagi`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal Tambah Tanggal Penting ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)] backdrop-blur-xs animate-in fade-in">
          <div
            className="rounded-3xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto border"
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
                  style={{ background: 'var(--color-sunken)', borderColor: 'var(--color-line)' }}
                >
                  <Gift className="w-5 h-5 text-[var(--color-clay)]" />
                </div>
                <div>
                  <h2
                    className="text-base font-bold leading-tight text-[var(--color-ink)]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Tambah Tanggal Spesial
                  </h2>
                  <p className="text-[11px] text-[var(--color-ink-soft)]">Ulang tahun atau hari peringatan kalian</p>
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
                style={{ background: 'var(--color-danger-tint)', color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-ink-soft)] mb-1.5 ">
                  Nama Peringatan / Acara <span className="text-[var(--color-error)]">*</span>
                </label>
                <DSInput
                  type="text"
                  value={title}
                  onChange={e => {
                    setTitle(e.target.value)
                    if (calendarErrors.title) setCalendarErrors(prev => ({ ...prev, title: undefined }))
                  }}
                  placeholder="Contoh: Ulang Tahun Daffa, Hari Jadi Circle"
                  className="w-full px-3.5 py-2.5 rounded-2xl text-xs outline-none transition-colors"
                  style={{
                    background: 'var(--color-sunken)',
                    border: calendarErrors.title
                      ? '1.5px solid var(--color-error)'
                      : '1.5px solid var(--color-line)',
                    color: 'var(--color-ink)',
                  }}
                />
                {calendarErrors.title && (
                  <p className="flex items-center gap-1.5 text-xs mt-1.5 font-medium" style={{ color: 'var(--color-error)' }}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {calendarErrors.title}
                  </p>
                )}
              </div>

              <div>
                <DatePicker
                  label="Tanggal Peringatan *"
                  value={date}
                  onChange={newDate => {
                    setDate(newDate)
                    if (calendarErrors.date) setCalendarErrors(prev => ({ ...prev, date: undefined }))
                  }}
                />
                {calendarErrors.date && (
                  <p className="flex items-center gap-1.5 text-xs mt-1.5 font-medium" style={{ color: 'var(--color-error)' }}>
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
                  className="w-4 h-4 rounded-md cursor-pointer"
                  style={{ accentColor: 'var(--color-clay)' }}
                />
                <label
                  htmlFor="recurring"
                  className="text-xs cursor-pointer select-none"
                  style={{ color: 'var(--color-ink-soft)' }}
                >
                  Ulangi peringatan ini setiap tahun (Ulang Tahun / Anniversary)
                </label>
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
                    <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</>
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


