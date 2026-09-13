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
  Sparkles,
  Camera,
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
import JoyDatePicker from '@/components/ui/JoyDatePicker'
import type { Memory, PhotoItem } from '@/types/database'

// Kategori warna psikologi kebahagiaan
const CATEGORY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  Nongkrong: { bg: '#FFE8B3', text: '#78350f', dot: '#FFD97D' },
  Liburan:   { bg: '#CDE7D0', text: '#1b4d3e', dot: '#A8D5BA' },
  Kuliner:   { bg: '#FFB4A2', text: '#9a3412', dot: '#FF8C69' },
  Perayaan:  { bg: '#CFE8F3', text: '#075985', dot: '#7dd3fc' },
  Random:    { bg: '#F3E8FF', text: '#6b21a8', dot: '#d8b4fe' },
}

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
  const [uploadStatus, setUploadStatus] = useState('')
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

      // 1. Upload photos in PARALLEL for blazing-fast performance
      let photos: PhotoItem[] = []
      if (selectedFiles.length > 0) {
        setUploadStatus(`Mengunggah ${selectedFiles.length} foto...`)
        const uploadPromises = selectedFiles.map(async (file, i) => {
          const uploadRes = await uploadPhoto(file, roomId, memoryId)
          return {
            id: `${Date.now()}-${i}`,
            storage_path: uploadRes.storagePath,
            url: uploadRes.downloadUrl,
            sort_order: i,
            is_cover: i === 0,
          }
        })
        photos = await Promise.all(uploadPromises)
      }

      setUploadStatus('Menyimpan kenangan...')

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
      setUploadStatus('')
      setShowAddModal(false)
      loadMemories()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal mengunggah kenangan.')
    } finally {
      setUploading(false)
      setUploadStatus('')
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-7">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--joy-yellow-light)] text-[var(--joy-charcoal)] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[var(--joy-peach)]" />
            <span>Momen Bahagia Bersama</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold flex items-center gap-2"
            style={{ color: 'var(--joy-charcoal)', fontFamily: 'var(--font-heading)' }}
          >
            📸 Galeri Kenangan
          </h1>
          <p className="text-xs sm:text-sm mt-1 text-[var(--text-secondary)]">
            Setiap gambar menyimpan ribuan tawa dan cerita indah yang kita lalui bersama.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-sm shrink-0 hover:opacity-95 hover:shadow-md cursor-pointer"
          style={{
            background: 'var(--gradient-memory)',
            color: 'var(--joy-charcoal)',
            boxShadow: '0 4px 16px rgba(255, 180, 162, 0.35)',
          }}
        >
          <Plus className="w-4 h-4" />
          Tambah Kenangan
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="w-4 h-4 shrink-0 text-[var(--text-muted)]" />
        {categories.map(cat => {
          const isSelected = filterCategory === cat
          const catStyle = CATEGORY_STYLES[cat]
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
              style={
                isSelected
                  ? {
                      background: catStyle ? catStyle.bg : 'var(--joy-yellow-light)',
                      color: catStyle ? catStyle.text : 'var(--joy-charcoal)',
                      boxShadow: '0 2px 8px rgba(255,217,125,0.4)',
                      fontWeight: 700,
                    }
                  : {
                      background: 'var(--surface)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                    }
              }
            >
              {cat === 'all' ? '✨ Semua Momen' : cat}
            </button>
          )
        })}
      </div>

      {/* Memories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-72 skeleton rounded-3xl" />
          ))}
        </div>
      ) : filteredMemories.length === 0 ? (
        <div
          className="text-center py-16 px-4 border-2 border-dashed rounded-3xl space-y-4 shadow-xs"
          style={{ borderColor: 'rgba(255, 217, 125, 0.6)', background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDF9 100%)' }}
        >
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-xs"
            style={{ background: 'var(--joy-yellow-light)' }}
          >
            <ImageIcon className="w-9 h-9" style={{ color: 'var(--joy-peach)' }} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--joy-charcoal)', fontFamily: 'var(--font-heading)' }}>
              Belum ada kenangan di sini
            </h3>
            <p className="text-xs mt-1.5 max-w-xs mx-auto text-[var(--text-secondary)]">
              Jadilah yang pertama mengabadikan foto dan momen tak terlupakan bersama orang-orang tersayang!
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            style={{ background: 'var(--gradient-memory)', color: 'var(--joy-charcoal)' }}
          >
            <Plus className="w-4 h-4" /> Tambah Kenangan Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemories.map(m => {
            const photos = m.photos || (m.memory_photos as PhotoItem[]) || []
            const cover = photos[0]?.url || photos[0]?.storage_path
            const memberLikes = m.likes || []
            const hasLiked = session ? memberLikes.includes(session.id) : false
            const likesCount = memberLikes.length
            const catStyle = (m.category && CATEGORY_STYLES[m.category]) ? CATEGORY_STYLES[m.category] : CATEGORY_STYLES['Nongkrong']

            return (
              <div
                key={m.id}
                className="group rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col"
                style={{
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDF9 100%)',
                  border: '1.5px solid rgba(255, 217, 125, 0.45)',
                  boxShadow: '0 8px 24px -4px rgba(255, 140, 105, 0.12), 0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                {/* Gradient top decorative strip */}
                <div className="h-1.5" style={{ background: 'var(--gradient-memory)' }} />

                {/* Photo Display */}
                <div className="relative aspect-4/3 overflow-hidden bg-[var(--surface-elevated)]">
                  {cover ? (
                    <img
                      src={getMediaUrl(cover)}
                      alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[var(--joy-yellow-light)]/20 to-[var(--joy-peach-light)]/30 text-[var(--joy-peach)]">
                      <Camera className="w-12 h-12 opacity-50 mb-1" />
                      <span className="text-[11px] font-semibold opacity-70">Tanpa Foto</span>
                    </div>
                  )}

                  {/* Gradient shadow overlay on photo */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

                  {/* Category badge */}
                  {m.category && (
                    <span
                      className="absolute top-3 left-3 px-2.5 py-1 rounded-xl text-[10px] font-bold shadow-xs flex items-center gap-1 backdrop-blur-xs"
                      style={{
                        background: catStyle.bg,
                        color: catStyle.text,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: catStyle.dot }} />
                      {m.category}
                    </span>
                  )}

                  {/* Multiple photos indicator */}
                  {photos.length > 1 && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      +{photos.length - 1} foto
                    </span>
                  )}

                  {/* Title overlay on photo bottom */}
                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <h3 className="text-sm font-bold leading-snug drop-shadow-sm truncate">
                      {m.title}
                    </h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  {/* Caption */}
                  <div>
                    {m.caption ? (
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        &ldquo;{m.caption}&rdquo;
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--text-muted)] italic">
                        Tidak ada catatan cerita.
                      </p>
                    )}
                  </div>

                  {/* Meta info & Like */}
                  <div
                    className="pt-2.5 flex items-center justify-between text-[11px]"
                    style={{ borderTop: '1px solid rgba(232, 232, 230, 0.7)', color: 'var(--text-secondary)' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-[var(--joy-peach)]" />
                        {m.date}
                      </span>
                      {m.location_name && (
                        <span className="flex items-center gap-1 truncate max-w-[120px] font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
                          {m.location_name}
                        </span>
                      )}
                    </div>

                    {/* Like button with heart beat */}
                    <button
                      onClick={() => handleToggleReaction(m.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
                      style={{
                        background: hasLiked ? 'var(--favorite-tint)' : 'transparent',
                        color: hasLiked ? 'var(--favorite)' : 'var(--text-muted)',
                      }}
                    >
                      <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current animate-pulse' : ''}`} />
                      {likesCount > 0 && <span className="font-bold text-xs">{likesCount}</span>}
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
          <div
            className="rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            style={{
              background: '#FFFFFF',
              border: '1.5px solid rgba(255, 217, 125, 0.6)',
              boxShadow: '0 20px 50px -10px rgba(255, 140, 105, 0.3)',
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
                  style={{ background: 'var(--gradient-memory)' }}
                >
                  <Plus className="w-5 h-5 text-[var(--joy-charcoal)]" />
                </div>
                <div>
                  <h2
                    className="text-base font-bold leading-tight text-[var(--joy-charcoal)]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Abadikan Kenangan Baru
                  </h2>
                  <p className="text-[11px] text-[var(--text-secondary)]">Simpan momen indah hari ini bersama sahabat</p>
                </div>
              </div>
              <button
                onClick={() => !uploading && setShowAddModal(false)}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-2xl bg-[var(--danger-tint)] text-[var(--danger-text)] text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitMemory} className="space-y-4">
              {/* Judul */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
                  Judul Momen *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Contoh: Liburan ke Dufan, Nonton Konser Bareng"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--joy-peach)] focus:ring-2 focus:ring-[var(--joy-yellow)]/40 transition-all"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
                  Cerita / Catatan
                </label>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  rows={3}
                  placeholder="Tuliskan cerita singkat tentang apa yang membuat momen ini berkesan..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--joy-peach)] focus:ring-2 focus:ring-[var(--joy-yellow)]/40 transition-all resize-none"
                />
              </div>

              {/* Tanggal (Custom Aesthetic JoyDatePicker) & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <JoyDatePicker
                    label="Tanggal"
                    value={date}
                    onChange={newDate => setDate(newDate)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--joy-peach)] focus:ring-2 focus:ring-[var(--joy-yellow)]/40 transition-all cursor-pointer font-medium"
                  >
                    <option value="Nongkrong">☕ Nongkrong</option>
                    <option value="Liburan">🏖️ Liburan</option>
                    <option value="Kuliner">🍕 Kuliner</option>
                    <option value="Perayaan">🎉 Perayaan</option>
                    <option value="Random">✨ Random</option>
                  </select>
                </div>
              </div>

              {/* Lokasi */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
                  Lokasi
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={e => setLocationName(e.target.value)}
                  placeholder="Contoh: Dufan Ancol, Kopi Kenangan Senopati..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--joy-peach)] focus:ring-2 focus:ring-[var(--joy-yellow)]/40 transition-all"
                />
              </div>

              {/* Upload Foto dengan Preview Asli */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
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
                  className="w-full py-5 border-2 border-dashed border-[var(--joy-peach)]/60 hover:border-[var(--joy-peach)] rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs text-[var(--text-secondary)] bg-[var(--joy-yellow-light)]/20 hover:bg-[var(--joy-yellow-light)]/40 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--joy-yellow-light)] text-[var(--joy-peach)] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-[var(--joy-charcoal)]">Pilih foto dari galeri</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Mendukung banyak foto sekaligus</span>
                </button>

                {/* File preview thumbnails with REAL IMAGE PREVIEWS */}
                {selectedFiles.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mt-3">
                    {selectedFiles.map((f, i) => {
                      const objectUrl = URL.createObjectURL(f)
                      return (
                        <div
                          key={i}
                          className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-[var(--joy-yellow)] shadow-xs bg-[var(--surface-elevated)]"
                        >
                          <img
                            src={objectUrl}
                            alt={f.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
                          <span className="absolute bottom-1 left-1.5 text-[9px] font-bold text-white drop-shadow truncate max-w-[80%]">
                            Foto {i + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(i)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-[var(--danger)] text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                            title="Hapus foto"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Actions & Status */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer hover:opacity-95 active:scale-95 shadow-sm"
                  style={{
                    background: 'var(--gradient-memory)',
                    color: 'var(--joy-charcoal)',
                    boxShadow: '0 4px 14px rgba(255, 180, 162, 0.35)',
                  }}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--joy-charcoal)]" />
                      <span>{uploadStatus || 'Menyimpan...'}</span>
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
