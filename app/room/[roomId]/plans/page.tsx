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
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[var(--success)]" />
            Agenda & Rencana Mendatang
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Bucket list, jadwal kumpul, dan rencana petualangan kita berikutnya.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-bold hover:bg-[var(--accent-hover)] transition-all active:scale-95 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Rencana Baru
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'all'
              ? 'bg-[var(--accent-tint)] text-[var(--accent-text)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]'
          }`}
        >
          Semua ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'upcoming'
              ? 'bg-[var(--accent-tint)] text-[var(--accent-text)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]'
          }`}
        >
          Akan Datang ({plans.filter(p => p.status === 'upcoming').length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'completed'
              ? 'bg-[var(--accent-tint)] text-[var(--accent-text)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]'
          }`}
        >
          Terlaksana ({plans.filter(p => p.status === 'completed').length})
        </button>
      </div>

      {/* Plans List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 skeleton rounded-2xl" />
          ))}
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-3xl space-y-3">
          <Calendar className="w-12 h-12 text-[var(--text-muted)] mx-auto" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Belum ada agenda di sini</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            Yuk susun rencana jalan-jalan atau kumpul bareng berikutnya!
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-bold hover:bg-[var(--accent-hover)] transition-all"
          >
            <Plus className="w-4 h-4" /> Buat Rencana
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPlans.map(plan => {
            const isDone = plan.status === 'completed'
            return (
              <div
                key={plan.id}
                className={`p-4 rounded-2xl bg-[var(--surface)] border transition-all flex items-start gap-3.5 shadow-sm ${
                  isDone
                    ? 'opacity-65 border-[var(--border)] bg-[var(--surface-subtle)]'
                    : 'border-[var(--border)] hover:border-[var(--accent-border)]'
                }`}
              >
                {/* Complete toggle button */}
                <button
                  onClick={() => handleToggleStatus(plan)}
                  className={`mt-0.5 transition-colors ${
                    isDone
                      ? 'text-[var(--success)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--success)]'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 fill-[var(--success-tint)]" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                {/* Plan Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <h3
                    className={`text-sm font-bold text-[var(--text-primary)] leading-tight ${
                      isDone ? 'line-through text-[var(--text-muted)]' : ''
                    }`}
                  >
                    {plan.title}
                  </h3>
                  {plan.description && (
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                      {plan.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {plan.date}
                    </span>
                    {plan.time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {plan.time}
                      </span>
                    )}
                    {plan.location && (
                      <span className="flex items-center gap-1 truncate max-w-[150px]">
                        <MapPin className="w-3.5 h-3.5" />
                        {plan.location}
                      </span>
                    )}
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
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[var(--success)]" />
                Buat Rencana Baru
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

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wide">
                  Nama Agenda *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Contoh: Barbeque Malam Tahun Baru"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-border)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wide">
                  Deskripsi Singkat
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Detail rencana, apa yang perlu dibawa, dll..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-border)] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wide">
                    Tanggal *
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
                    Waktu / Jam
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-border)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wide">
                  Lokasi / Tempat
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Contoh: Rooftop Rumah Daffa / Puncak"
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
