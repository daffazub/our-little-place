'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Calendar, Plus, MapPin, Clock, CheckCircle2, Circle, X, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import {
  collection,
  addDoc,
  doc,
  getDocs,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import DatePicker from '@/components/ui/DatePicker'
import PageHeaderCard from '@/components/ui/PageHeaderCard'
import CategoryFilterBar from '@/components/features/memories/CategoryFilterBar'
import type { Plan, PlanStatus } from '@/types'
import { getLocalDateString, formatLocalDate } from '@/lib/utils/date'
import { Button as DSButton } from '@/components/ui/Button'
import { Input as DSInput } from '@/components/ui/Input'
import { Textarea as DSTextarea } from '@/components/ui/Textarea'

export default function PlansPage() {
  const params = useParams<{ roomId: string }>()
  const { session } = useSession()

  const [plans, setPlans]       = useState<Plan[]>([])
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState<PlanStatus | 'all'>('all')
  const [showAddModal, setShowAddModal] = useState(false)

  // Form state
  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate]             = useState(getLocalDateString())
  const [time, setTime]             = useState('18:00')
  const [location, setLocation]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [planErrors, setPlanErrors] = useState<{ title?: string; date?: string }>({})

  const loadPlans = async () => {
    if (!params.roomId) return
    setLoading(true)
    try {
      const roomId = params.roomId
      const plansRef = collection(db, 'rooms', roomId, 'plans')
      let list: Plan[] = []
      try {
        const q = query(plansRef, orderBy('date', 'asc'))
        const snap = await getDocs(q)
        list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Plan))
      } catch {
        const snap = await getDocs(plansRef)
        list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Plan))
        list.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      }
      setPlans(list)
    } catch (err) {
      console.error('Failed to load plans:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPlans() }, [params.roomId])

  const handleToggleStatus = async (plan: Plan) => {
    if (!params.roomId) return
    const nextStatus: PlanStatus = plan.status === 'completed' ? 'upcoming' : 'completed'
    try {
      const planRef = doc(db, 'rooms', params.roomId, 'plans', plan.id)
      await updateDoc(planRef, { status: nextStatus })
      setPlans(prev => prev.map(p => (p.id === plan.id ? { ...p, status: nextStatus } : p)))
    } catch (err) {
      console.error('Failed to update plan status:', err)
      loadPlans()
    }
  }

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: { title?: string; date?: string } = {}
    if (!title.trim()) errs.title = 'Nama agenda rencana wajib diisi'
    if (!date.trim()) errs.date = 'Tanggal rencana wajib dipilih'
    if (Object.keys(errs).length > 0) { setPlanErrors(errs); return }
    if (!session || !params.roomId) return

    setPlanErrors({})
    setSubmitting(true)
    setError('')
    try {
      await addDoc(collection(db, 'rooms', params.roomId, 'plans'), {
        room_id: params.roomId,
        title: title.trim(),
        description: description.trim() || null,
        date,
        time: time || null,
        location: location.trim() || null,
        status: 'upcoming',
        created_by: session.id,
        created_at: new Date().toISOString(),
      })
      setTitle('')
      setDescription('')
      setLocation('')
      setPlanErrors({})
      setShowAddModal(false)
      loadPlans()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat rencana.')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredPlans = activeTab === 'all'
    ? plans
    : plans.filter(p => p.status === activeTab)

  const PLAN_FILTER_TABS = [
    { id: 'all',       label: `Semua (${plans.length})` },
    { id: 'upcoming',  label: `Akan Datang (${plans.filter(p => p.status === 'upcoming').length})` },
    { id: 'completed', label: `Terlaksana (${plans.filter(p => p.status === 'completed').length})` },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">

      {/* ── Page Header Card ── */}
      <PageHeaderCard
        badge={{ text: 'Agenda & Bucket List', icon: Sparkles }}
        title="Agenda & Rencana"
        description="Bucket list, jadwal kumpul, dan rencana petualangan kita berikutnya."
        cta={{
          label: 'Rencana Baru',
          icon: Plus,
          onClick: () => { setPlanErrors({}); setError(''); setShowAddModal(true) },
        }}
      />

      {/* ── Filter Status ── */}
      <CategoryFilterBar
        categories={PLAN_FILTER_TABS}
        selectedId={activeTab}
        onSelect={(id) => setActiveTab(id as PlanStatus | 'all')}
        label="Status"
      />

      {/* Plans List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}
        </div>
      ) : filteredPlans.length === 0 ? (
        <div
          className="text-center py-16 px-4 border-2 border-dashed rounded-3xl space-y-4"
          style={{ borderColor: 'var(--color-line)', background: 'var(--color-surface)' }}
        >
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center border"
            style={{ background: 'var(--color-sunken)', borderColor: 'var(--color-line)' }}
          >
            <Calendar className="w-9 h-9 text-[var(--color-clay)]" />
          </div>
          <div>
            <h3
              className="text-sm font-bold text-[var(--color-ink)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Belum ada agenda di sini
            </h3>
            <p className="text-xs mt-1 max-w-xs mx-auto text-[var(--color-ink-soft)]">
              Yuk susun rencana jalan-jalan atau kumpul bareng berikutnya!
            </p>
          </div>
            <DSButton
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold hover:opacity-90 transition-opacity text-[var(--color-white)]"
            style={{ background: 'var(--color-clay)' }}
          >
            <Plus className="w-4 h-4" /> Buat Rencana
            </DSButton>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredPlans.map(plan => {
            const isDone = plan.status === 'completed'
            return (
              <div
                key={plan.id}
                className="group rounded-2xl overflow-hidden transition-colors duration-200 hover:-translate-y-0.5 flex items-stretch"
                style={{
                  background: isDone ? 'var(--color-sunken)' : 'var(--color-surface)',
                  border: `1.5px solid ${isDone ? 'var(--color-line)' : 'var(--color-line)'}`,
                  boxShadow: isDone ? 'none' : 'var(--shadow-card)',
                  opacity: isDone ? 0.72 : 1,
                }}
              >
                {/* Aksen kiri — sage jika selesai, honey jika akan datang */}
                <div
                  className="w-1.5 shrink-0 self-stretch rounded-l-2xl"
                  style={{ background: isDone ? 'var(--color-sage)' : 'var(--color-honey)' }}
                />

                <div className="flex-1 p-4 sm:p-5 flex items-start gap-4">
                  {/* Checkbox gaya tangan */}
                  <button
                    onClick={() => handleToggleStatus(plan)}
                    className="mt-0.5 transition-transform active:scale-90 cursor-pointer shrink-0"
                    title={isDone ? 'Tandai belum selesai' : 'Tandai selesai'}
                    aria-label={isDone ? 'Tandai belum selesai' : 'Tandai selesai'}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-[var(--color-sage)]" style={{ fill: 'var(--color-sage-tint)' }} />
                    ) : (
                      <Circle className="w-5 h-5 text-[var(--color-line)] hover:text-[var(--color-clay)] transition-colors" />
                    )}
                  </button>

                  {/* Konten */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <h3
                      className={`text-sm font-bold leading-tight ${
                        isDone ? 'line-through text-[var(--color-ink-soft)]' : 'text-[var(--color-ink)]'
                      }`}
                    >
                      {plan.title}
                    </h3>
                    {plan.description && (
                      <p className="text-xs text-[var(--color-ink-soft)] line-clamp-2 leading-relaxed">
                        {plan.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      <span
                        className="inline-flex items-center gap-1 font-medium px-2.5 py-0.5 rounded-full border"
                        style={{
                          background: 'var(--color-sunken)',
                          borderColor: 'var(--color-line)',
                          color: 'var(--color-ink-soft)',
                        }}
                      >
                        <Calendar className="w-3.5 h-3.5 text-[var(--color-clay)]" />
                        {formatLocalDate(plan.date, { showDayName: true })}
                      </span>
                      {plan.time && (
                        <span
                          className="inline-flex items-center gap-1 font-medium px-2.5 py-0.5 rounded-full border"
                          style={{
                            background: 'var(--color-sunken)',
                            borderColor: 'var(--color-line)',
                            color: 'var(--color-ink-soft)',
                          }}
                        >
                          <Clock className="w-3.5 h-3.5 text-[var(--color-ink-soft)]" />
                          {plan.time}
                        </span>
                      )}
                      {plan.location && (
                        <span
                          className="inline-flex items-center gap-1 font-medium px-2.5 py-0.5 rounded-full border truncate max-w-[170px]"
                          style={{
                            background: 'var(--color-dusk)',
                            borderColor: 'var(--color-line)',
                            color: 'var(--color-ink-soft)',
                          }}
                        >
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {plan.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal Buat Rencana ── */}
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
            {/* Modal header */}
            <div
              className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: 'var(--color-line)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center border"
                  style={{ background: 'var(--color-sunken)', borderColor: 'var(--color-line)' }}
                >
                  <Calendar className="w-5 h-5 text-[var(--color-clay)]" />
                </div>
                <div>
                  <h2
                    className="text-base font-bold leading-tight text-[var(--color-ink)]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Buat Rencana Baru
                  </h2>
                  <p className="text-[11px] text-[var(--color-ink-soft)]">Agendakan momen seru berikutnya bersama</p>
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

            <form onSubmit={handleCreatePlan} className="space-y-4">
              {/* Nama rencana */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-ink-soft)] mb-1.5">
                  Nama Rencana / Aktivitas <span className="text-[var(--color-error)]">*</span>
                </label>
                <DSInput
                  type="text"
                  value={title}
                  onChange={e => { setTitle(e.target.value); if (planErrors.title) setPlanErrors(p => ({ ...p, title: undefined })) }}
                  placeholder="Contoh: Roadtrip ke Jogja, Bukber Bareng"
                  className="w-full px-3.5 py-2.5 rounded-2xl text-xs outline-none transition-colors"
                  style={{
                    background: 'var(--color-sunken)',
                    border: planErrors.title ? '1.5px solid var(--color-error)' : '1.5px solid var(--color-line)',
                    color: 'var(--color-ink)',
                  }}
                />
                {planErrors.title && (
                  <p className="mt-1.5 text-[11px] font-medium flex items-center gap-1" style={{ color: 'var(--color-error)' }}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>{planErrors.title}</span>
                  </p>
                )}
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-ink-soft)] mb-1.5">
                  Catatan / Deskripsi
                </label>
                <DSTextarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Detail rencana, apa yang perlu dibawa, dll..."
                  className="w-full px-3.5 py-2.5 rounded-2xl text-xs outline-none transition-colors resize-none"
                  style={{
                    background: 'var(--color-sunken)',
                    border: '1.5px solid var(--color-line)',
                    color: 'var(--color-ink)',
                  }}
                />
              </div>

              {/* Tanggal & Waktu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <DatePicker
                    label="Tanggal *"
                    value={date}
                    onChange={newDate => { setDate(newDate); if (planErrors.date) setPlanErrors(p => ({ ...p, date: undefined })) }}
                  />
                  {planErrors.date && (
                    <p className="mt-1.5 text-[11px] font-medium flex items-center gap-1" style={{ color: 'var(--color-error)' }}>
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>{planErrors.date}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-ink-soft)] mb-1.5">
                    Waktu / Jam
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl text-xs outline-none transition-colors font-medium"
                    style={{
                      background: 'var(--color-sunken)',
                      border: '1.5px solid var(--color-line)',
                      color: 'var(--color-ink)',
                    }}
                  />
                </div>
              </div>

              {/* Lokasi */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-ink-soft)] mb-1.5">
                  Lokasi / Tempat
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Contoh: Rooftop Rumah Daffa / Puncak"
                  className="w-full px-3.5 py-2.5 rounded-2xl text-xs outline-none transition-colors"
                  style={{
                    background: 'var(--color-sunken)',
                    border: '1.5px solid var(--color-line)',
                    color: 'var(--color-ink)',
                  }}
                />
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
                    'Simpan Rencana'
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

