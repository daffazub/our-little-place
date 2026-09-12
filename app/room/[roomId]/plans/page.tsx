'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Calendar, Plus, MapPin, Clock, CheckCircle2, Circle, X, Loader2 } from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import { supabase } from '@/lib/supabase/client'
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
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('room_id', params.roomId)
        .order('date', { ascending: true })

      if (!error && data) {
        setPlans(data as Plan[])
      }
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
    const nextStatus: PlanStatus = plan.status === 'completed' ? 'upcoming' : 'completed'
    try {
      await supabase
        .from('plans')
        .update({ status: nextStatus })
        .eq('id', plan.id)

      loadPlans()
    } catch (err) {
      console.error('Failed to update plan status:', err)
    }
  }

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Nama agenda rencana wajib diisi.')
      return
    }
    if (!session) return

    setSubmitting(true)
    setError('')

    try {
      const { error: insertError } = await supabase.from('plans').insert({
        room_id: params.roomId,
        title: title.trim(),
        description: description.trim() || null,
        date,
        time: time || null,
        location: location.trim() || null,
        status: 'upcoming',
        created_by: session.id,
      })

      if (insertError) throw new Error(insertError.message)

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
                  className="mt-0.5 shrink-0 text-[var(--text-muted)] hover:text-[var(--success)] transition-colors"
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-sm font-bold truncate ${isDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                      {plan.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0 ${
                      isDone ? 'bg-[var(--success-tint)] text-[var(--success-text)]' : 'bg-[var(--accent-tint)] text-[var(--accent-text)]'
                    }`}>
                      {isDone ? 'Selesai' : 'Rencana'}
                    </span>
                  </div>

                  {plan.description && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                      {plan.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-muted)] mt-2">
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
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[var(--accent-text)]" />
                Tambah Rencana Baru
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
                  placeholder="Contoh: Barbeque Akhir Tahun, Nonton Konser"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-border)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    Waktu (Opsional)
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
                  Lokasi Pertemuan
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Contoh: Rumah Daffa, Mall Grand Indonesia..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-border)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wide">
                  Detail Catatan
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Rincian dresscode, barang yang perlu dibawa, dll..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-border)] resize-none"
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
