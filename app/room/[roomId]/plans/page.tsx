'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Calendar, Plus, MapPin, Clock, CheckCircle2, Circle, X, Loader2 } from 'lucide-react'
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
import JoyDatePicker from '@/components/ui/JoyDatePicker'
import type { Plan, PlanStatus } from '@/types/database'

export default function PlansPage() {
  const params = useParams<{ roomId: string }>()
  const { session } = useSession()

  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<PlanStatus | 'all'>('all')
  const [showAddModal, setShowAddModal] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState('18:00')
  const [location, setLocation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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

  useEffect(() => {
    loadPlans()
  }, [params.roomId])

  const handleToggleStatus = async (plan: Plan) => {
    if (!params.roomId) return
    const nextStatus: PlanStatus = plan.status === 'completed' ? 'upcoming' : 'completed'
    try {
      const planRef = doc(db, 'rooms', params.roomId, 'plans', plan.id)
      await updateDoc(planRef, { status: nextStatus })

      // Optimistic update
      setPlans(prev =>
        prev.map(p => (p.id === plan.id ? { ...p, status: nextStatus } : p))
      )
    } catch (err) {
      console.error('Failed to update plan status:', err)
      loadPlans()
    }
  }

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Nama agenda rencana wajib diisi.')
      return
    }
    if (!session || !params.roomId) return

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--joy-charcoal)', fontFamily: 'var(--font-heading)' }}
          >
            📅 Agenda &amp; Rencana
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Bucket list, jadwal kumpul, dan rencana petualangan kita berikutnya.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-sm shrink-0 hover:opacity-90"
          style={{ background: 'var(--gradient-plan)', color: 'var(--joy-charcoal)' }}
        >
          <Plus className="w-4 h-4" />
          Rencana Baru
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
        {([
          { key: 'all', label: `Semua (${plans.length})` },
          { key: 'upcoming', label: `Akan Datang (${plans.filter(p => p.status === 'upcoming').length})` },
          { key: 'completed', label: `Terlaksana (${plans.filter(p => p.status === 'completed').length})` },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={
              activeTab === tab.key
                ? { background: 'var(--joy-yellow-light)', color: 'var(--joy-charcoal)' }
                : { color: 'var(--text-secondary)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Plans List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 skeleton rounded-2xl" />
          ))}
        </div>
      ) : filteredPlans.length === 0 ? (
        <div
          className="text-center py-16 px-4 border-2 border-dashed rounded-3xl space-y-4"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
            style={{ background: 'var(--joy-yellow-light)' }}
          >
            <Calendar className="w-9 h-9" style={{ color: 'var(--joy-peach)' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Belum ada agenda di sini
            </h3>
            <p className="text-xs mt-1 max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
              Yuk susun rencana jalan-jalan atau kumpul bareng berikutnya!
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
            style={{ background: 'var(--gradient-plan)', color: 'var(--joy-charcoal)' }}
          >
            <Plus className="w-4 h-4" /> Buat Rencana
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredPlans.map(plan => {
            const isDone = plan.status === 'completed'
            return (
              <div
                key={plan.id}
                className="group rounded-3xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 flex items-stretch shadow-xs"
                style={{
                  background: isDone
                    ? 'rgba(250, 250, 248, 0.7)'
                    : 'linear-gradient(180deg, #FFFFFF 0%, #FFFDF9 100%)',
                  border: isDone
                    ? '1.5px solid rgba(232, 232, 230, 0.8)'
                    : '1.5px solid rgba(255, 217, 125, 0.45)',
                  boxShadow: isDone
                    ? 'none'
                    : '0 6px 20px -4px rgba(255, 217, 125, 0.2)',
                  opacity: isDone ? 0.75 : 1,
                }}
              >
                {/* Gradient left accent bar */}
                <div
                  className="w-2 shrink-0 self-stretch"
                  style={{
                    background: isDone
                      ? 'var(--border)'
                      : 'var(--gradient-plan)',
                  }}
                />

                <div className="flex-1 p-4 sm:p-5 flex items-start gap-4">
                  {/* Complete toggle button */}
                  <button
                    onClick={() => handleToggleStatus(plan)}
                    className="mt-0.5 transition-transform active:scale-90 cursor-pointer shrink-0"
                    style={{ color: isDone ? 'var(--success)' : 'var(--joy-yellow)' }}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-[var(--success)] fill-[var(--success-tint)]" />
                    ) : (
                      <Circle className="w-5 h-5 text-[var(--joy-peach)] hover:scale-110 transition-transform" />
                    )}
                  </button>

                  {/* Plan Content */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <h3
                      className={`text-sm font-bold leading-tight ${isDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--joy-charcoal)]'}`}
                    >
                      {plan.title}
                    </h3>
                    {plan.description && (
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {plan.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      <span className="inline-flex items-center gap-1 font-medium px-2.5 py-0.5 rounded-full bg-[var(--joy-yellow-light)] text-[var(--joy-charcoal)]">
                        <Calendar className="w-3.5 h-3.5 text-[var(--joy-peach)]" />
                        {plan.date}
                      </span>
                      {plan.time && (
                        <span className="inline-flex items-center gap-1 font-medium px-2.5 py-0.5 rounded-full bg-[var(--joy-green-light)] text-[#1b4d3e]">
                          <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                          {plan.time}
                        </span>
                      )}
                      {plan.location && (
                        <span className="inline-flex items-center gap-1 font-medium px-2.5 py-0.5 rounded-full bg-[var(--joy-blue)] text-[#075985] truncate max-w-[170px]">
                          <MapPin className="w-3.5 h-3.5 text-[#0284c7]" />
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

      {/* Modal Buat Rencana */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            style={{
              background: '#FFFFFF',
              border: '1.5px solid rgba(255, 217, 125, 0.6)',
              boxShadow: '0 20px 50px -10px rgba(255, 217, 125, 0.35)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
                  style={{ background: 'var(--gradient-plan)' }}
                >
                  <Calendar className="w-5 h-5 text-[var(--joy-charcoal)]" />
                </div>
                <div>
                  <h2
                    className="text-base font-bold leading-tight text-[var(--joy-charcoal)]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Buat Rencana Baru
                  </h2>
                  <p className="text-[11px] text-[var(--text-secondary)]">Agendakan momen seru berikutnya bersama</p>
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

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
                  Nama Rencana / Aktivitas *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Contoh: Roadtrip ke Jogja, Bukber Bareng"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--joy-peach)] focus:ring-2 focus:ring-[var(--joy-yellow)]/40 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
                  Catatan / Deskripsi
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Detail rencana, apa yang perlu dibawa, dll..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--joy-peach)] focus:ring-2 focus:ring-[var(--joy-yellow)]/40 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <JoyDatePicker
                    label="Tanggal *"
                    value={date}
                    onChange={newDate => setDate(newDate)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
                    Waktu / Jam
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--joy-peach)] focus:ring-2 focus:ring-[var(--joy-yellow)]/40 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
                  Lokasi / Tempat
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Contoh: Rooftop Rumah Daffa / Puncak"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--joy-peach)] focus:ring-2 focus:ring-[var(--joy-yellow)]/40 transition-all"
                />
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
                    background: 'var(--gradient-plan)',
                    color: 'var(--joy-charcoal)',
                    boxShadow: '0 4px 14px rgba(255, 217, 125, 0.4)',
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
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
