'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Heart, Calendar, Sparkles, Send, Loader2 } from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import type { LittleThing } from '@/types/database'

export default function LittleThingsPage() {
  const params = useParams<{ roomId: string }>()
  const { session } = useSession()

  const [items, setItems] = useState<LittleThing[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadItems = async () => {
    if (!params.roomId) return
    setLoading(true)
    try {
      const roomId = params.roomId
      const thingsRef = collection(db, 'rooms', roomId, 'little_things')
      let list: LittleThing[] = []

      try {
        const q = query(thingsRef, orderBy('created_at', 'desc'))
        const snap = await getDocs(q)
        list = snap.docs.map(d => ({ id: d.id, ...d.data() } as LittleThing))
      } catch {
        const snap = await getDocs(thingsRef)
        list = snap.docs.map(d => ({ id: d.id, ...d.data() } as LittleThing))
        list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      }

      setItems(list)
    } catch (err) {
      console.error('Failed to load little things:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [params.roomId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    if (!session || !params.roomId) return

    setSubmitting(true)
    setError('')

    try {
      await addDoc(collection(db, 'rooms', params.roomId, 'little_things'), {
        room_id: params.roomId,
        text: text.trim(),
        date: new Date().toISOString().split('T')[0],
        created_by: session.id,
        created_at: new Date().toISOString(),
      })

      setText('')
      loadItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan hal kecil.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Heart className="w-6 h-6 text-[var(--favorite)]" />
          Hal-Hal Kecil (Little Things)
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Kebaikan sederhana, momen manis tanpa rencana, atau perhatian kecil yang menghangatkan hari.
        </p>
      </div>

      {/* Input Box Quick Add */}
      <form
        onSubmit={handleCreate}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-4 shadow-sm space-y-3"
      >
        {error && (
          <p className="text-xs text-[var(--danger-text)] bg-[var(--danger-tint)] p-2.5 rounded-xl font-medium">
            {error}
          </p>
        )}

        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--accent-text)] shrink-0" />
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Hal kecil apa yang bikin kamu tersenyum hari ini?..."
            className="flex-1 px-3 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent-border)]"
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-bold hover:bg-[var(--accent-hover)] transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Kirim</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Feed List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 skeleton rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-3xl space-y-3">
          <Heart className="w-12 h-12 text-[var(--text-muted)] mx-auto" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Belum ada hal kecil yang dicatat</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            Ceritakan hal sederhana yang berkesan tentang sahabatmu hari ini.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex items-start gap-3 hover:border-[var(--accent-border)] transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-[var(--favorite-tint)] text-[var(--favorite)] flex items-center justify-center shrink-0 mt-0.5">
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed">
                  {item.text}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mt-1.5">
                  <Calendar className="w-3 h-3" />
                  <span>{item.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
