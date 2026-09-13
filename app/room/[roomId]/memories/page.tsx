'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
  Image as ImageIcon,
  Plus,
  Calendar,
  MapPin,
  X,
  Heart,
  UploadCloud,
  Loader2,
  Filter,
} from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { uploadPhoto, getMediaUrl } from '@/lib/storage'
import type { Memory, PhotoItem } from '@/types/database'

export default function MemoriesPage() {
  const params = useParams<{ roomId: string }>()
  const { session } = useSession()

  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // Form state
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [locationName, setLocationName] = useState('')
  const [category, setCategory] = useState('Nongkrong')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [formError, setFormError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadMemories = async () => {
    if (!params.roomId) return
    setLoading(true)
    try {
      const roomId = params.roomId
      const memoriesRef = collection(db, 'rooms', roomId, 'memories')
      let list: Memory[] = []

      try {
        const q = query(memoriesRef, orderBy('date', 'desc'))
        const snap = await getDocs(q)
        list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Memory))
      } catch {
        // Fallback without index
        const snap = await getDocs(memoriesRef)
        list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Memory))
        list.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      }

      setMemories(list)
    } catch (err) {
      console.error('Failed to load memories:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMemories()
  }, [params.roomId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setSelectedFiles(prev => [...prev, ...files])
    }
  }

  const removeSelectedFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmitMemory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setFormError('Judul kenangan wajib diisi.')
      return
    }
    if (!session || !params.roomId) return

    setUploading(true)
    setFormError('')

    try {
      const roomId = params.roomId
      const newMemoryRef = doc(collection(db, 'rooms', roomId, 'memories'))
      const memoryId = newMemoryRef.id

      // 1. Upload photos to Firebase Storage if any
      const photos: PhotoItem[] = []
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i]
          const uploadRes = await uploadPhoto(file, roomId, memoryId)
          photos.push({
            id: `${Date.now()}-${i}`,
            storage_path: uploadRes.storagePath,
            url: uploadRes.downloadUrl,
            sort_order: i,
            is_cover: i === 0,
          })
        }
      }

      const newMemoryData: Memory = {
        id: memoryId,
        room_id: roomId,
        title: title.trim(),
        caption: caption.trim() || null,
        story: null,
        date,
        location_name: locationName.trim() || null,
        category,
        photos,
        likes: [],
        created_by: session.id,
        created_at: new Date().toISOString(),
      }

      await setDoc(newMemoryRef, newMemoryData)

      // Reset form & reload
      setTitle('')
      setCaption('')
      setLocationName('')
      setSelectedFiles([])
      setShowAddModal(false)
      loadMemories()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal mengunggah kenangan.')
    } finally {
      setUploading(false)
    }
  }

  const handleToggleReaction = async (memoryId: string) => {
    if (!session || !params.roomId) return
    try {
      const memory = memories.find(m => m.id === memoryId)
      if (!memory) return

      const memberLikes = memory.likes || []
      const hasLiked = memberLikes.includes(session.id)
      const memoryRef = doc(db, 'rooms', params.roomId, 'memories', memoryId)

      if (hasLiked) {
        await updateDoc(memoryRef, {
          likes: arrayRemove(session.id),
        })
      } else {
        await updateDoc(memoryRef, {
          likes: arrayUnion(session.id),
        })
      }

      // Optimistic update locally
      setMemories(prev =>
        prev.map(m => {
          if (m.id !== memoryId) return m
          const currentLikes = m.likes || []
          return {
            ...m,
            likes: hasLiked
              ? currentLikes.filter(id => id !== session.id)
              : [...currentLikes, session.id],
          }
        })
      )
    } catch (err) {
      console.error('Reaction error:', err)
      loadMemories()
    }
  }

  const categories = ['all', 'Nongkrong', 'Liburan', 'Kuliner', 'Perayaan', 'Random']
  const filteredMemories = filterCategory === 'all'
    ? memories
    : memories.filter(m => m.category === filterCategory)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: 'var(--joy-charcoal)', fontFamily: 'var(--font-heading)' }}
          >
            📸 Galeri Kenangan
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Setiap gambar menyimpan ribuan tawa dan cerita indah kita bersama.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-sm shrink-0 hover:opacity-90"
          style={{ background: 'var(--gradient-memory)', color: 'var(--joy-charcoal)' }}
        >
          <Plus className="w-4 h-4" />
          Tambah Kenangan
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
            style={
              filterCategory === cat
                ? {
                    background: 'var(--joy-yellow-light)',
                    color: 'var(--joy-charcoal)',
                    boxShadow: '0 1px 4px rgba(255,217,125,0.4)',
                  }
                : {
                    background: 'var(--surface)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }
            }
          >
            {cat === 'all' ? 'Semua Momen' : cat}
          </button>
        ))}
      </div>

      {/* Memories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 skeleton rounded-3xl" />
          ))}
        </div>
      ) : filteredMemories.length === 0 ? (
        <div
          className="text-center py-16 px-4 border-2 border-dashed rounded-3xl space-y-4"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
            style={{ background: 'var(--joy-yellow-light)' }}
          >
            <ImageIcon className="w-9 h-9" style={{ color: 'var(--joy-peach)' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Belum ada kenangan di sini
            </h3>
            <p className="text-xs mt-1 max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
              Jadilah yang pertama mengabadikan foto dan momen tak terlupakan bersama teman-teman!
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
            style={{ background: 'var(--gradient-memory)', color: 'var(--joy-charcoal)' }}
          >
            <Plus className="w-4 h-4" /> Tambah Kenangan Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMemories.map(m => {
            const photos = m.photos || (m.memory_photos as PhotoItem[]) || []
            const cover = photos[0]?.url || photos[0]?.storage_path
            const memberLikes = m.likes || []
            const hasLiked = session ? memberLikes.includes(session.id) : false
            const likesCount = memberLikes.length

            return (
              <div
                key={m.id}
                className="rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                {/* Gradient top strip */}
                <div className="h-1.5" style={{ background: 'var(--gradient-memory)' }} />

                {/* Photo Display */}
                <div className="relative aspect-4/3 overflow-hidden" style={{ background: 'var(--surface-elevated)' }}>
                  {cover ? (
                    <img
                      src={getMediaUrl(cover)}
                      alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 opacity-30" style={{ color: 'var(--joy-peach)' }} />
                    </div>
                  )}

                  {/* Category badge */}
                  {m.category && (
                    <span
                      className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                      style={{ background: 'var(--joy-yellow-light)', color: 'var(--joy-charcoal)' }}
                    >
                      {m.category}
                    </span>
                  )}

                  {/* Multiple photos indicator */}
                  {photos.length > 1 && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-medium">
                      +{photos.length - 1} foto
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                      {m.title}
                    </h3>
                    {m.caption && (
                      <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {m.caption}
                      </p>
                    )}
                  </div>

                  {/* Meta info */}
                  <div
                    className="pt-2 flex items-center justify-between text-[11px]"
                    style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {m.date}
                      </span>
                      {m.location_name && (
                        <span className="flex items-center gap-1 truncate max-w-[100px]">
                          <MapPin className="w-3.5 h-3.5" />
                          {m.location_name}
                        </span>
                      )}
                    </div>

                    {/* Like button */}
                    <button
                      onClick={() => handleToggleReaction(m.id)}
                      className="flex items-center gap-1 p-1 rounded-lg transition-colors"
                      style={{ color: hasLiked ? 'var(--favorite)' : 'var(--text-muted)' }}
                    >
                      <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                      {likesCount > 0 && <span className="font-semibold">{likesCount}</span>}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Tambah Kenangan */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[var(--accent-text)]" />
                Abadikan Kenangan Baru
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-[var(--danger-tint)] text-[var(--danger-text)] text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitMemory} className="space-y-4">
              {/* Judul */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wide">
                  Judul Momen *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Contoh: Liburan ke Pantai, Nonton Bareng"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-border)]"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wide">
                  Cerita / Catatan
                </label>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  rows={3}
                  placeholder="Tuliskan cerita singkat tentang apa yang terjadi di hari itu..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-border)] resize-none"
                />
              </div>

              {/* Tanggal & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-border)]"
                  >
                    <option value="Nongkrong">Nongkrong</option>
                    <option value="Liburan">Liburan</option>
                    <option value="Kuliner">Kuliner</option>
                    <option value="Perayaan">Perayaan</option>
                    <option value="Random">Random</option>
                  </select>
                </div>
              </div>

              {/* Lokasi */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wide">
                  Lokasi
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={e => setLocationName(e.target.value)}
                  placeholder="Contoh: Kopi Kenangan Senopati, Bandung..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-border)]"
                />
              </div>

              {/* Upload Foto */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wide">
                  Foto Kenangan
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-[var(--border)] hover:border-[var(--accent-border)] rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--accent-tint)]/30 transition-colors"
                >
                  <UploadCloud className="w-6 h-6 text-[var(--accent-text)]" />
                  <span>Pilih foto dari galeri</span>
                </button>

                {/* File preview thumbnails */}
                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedFiles.map((f, i) => (
                      <div
                        key={i}
                        className="relative w-14 h-14 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] overflow-hidden flex items-center justify-center text-[10px]"
                      >
                        <span className="truncate px-1">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(i)}
                          className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
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
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-bold hover:bg-[var(--accent-hover)] transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Kenangan'
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
