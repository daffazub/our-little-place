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

  Sparkles,
  Camera,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { uploadPhoto, getMediaUrl, deleteStorageFile } from '@/lib/utils/image'
import { getLocalDateString } from '@/lib/utils/date'
import DatePicker from '@/components/ui/DatePicker'
import PageHeaderCard from '@/components/ui/PageHeaderCard'
import CategoryFilterBar from '@/components/features/memories/CategoryFilterBar'
import { useToast } from '@/context/ToastContext'
import type { Memory, PhotoItem } from '@/types'
import { Button as DSButton } from '@/components/ui/Button'
import { Input as DSInput } from '@/components/ui/Input'
import { Textarea as DSTextarea } from '@/components/ui/Textarea'

// Kategori — pakai token warna baru, tidak ada gradasi atau hex lama
const CATEGORY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  Nongkrong: { bg: 'var(--color-warning-tint)', text: 'var(--color-warning-text)', dot: 'var(--color-cat-nongkrong)' },
  Liburan:   { bg: 'var(--color-dusk)', text: 'var(--color-info-text)', dot: 'var(--color-cat-liburan)' },
  Kuliner:   { bg: 'var(--color-clay-tint)', text: 'var(--color-clay-contrast)', dot: 'var(--color-cat-kuliner)' },
  Perayaan:  { bg: 'var(--color-celebration-tint)', text: 'var(--color-celebration-text)', dot: 'var(--color-cat-perayaan)' },
  Random:    { bg: 'var(--color-random-tint)', text: 'var(--color-random-text)', dot: 'var(--color-cat-random)' },
}

export default function MemoriesPage() {
  const params = useParams<{ roomId: string }>()
  const { session } = useSession()
  const toast = useToast()

  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // Form state (Tambah)
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [date, setDate] = useState(getLocalDateString())
  const [locationName, setLocationName] = useState('')
  const [category, setCategory] = useState('Nongkrong')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [formError, setFormError] = useState('')
  const [addErrors, setAddErrors] = useState<{ title?: string; date?: string; category?: string; photos?: string }>({})
  const [photoLimitWarning, setPhotoLimitWarning] = useState('')

  // Edit state
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editCaption, setEditCaption] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editCategory, setEditCategory] = useState('Nongkrong')
  const [existingPhotos, setExistingPhotos] = useState<PhotoItem[]>([])
  const [newEditFiles, setNewEditFiles] = useState<File[]>([])
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')
  const [editErrors, setEditErrors] = useState<{ title?: string; date?: string; category?: string; photos?: string }>({})

  // Delete state
  const [deletingMemory, setDeletingMemory] = useState<Memory | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Lightbox Preview state (Modern Clean Minimalist)
  const [previewMemory, setPreviewMemory] = useState<Memory | null>(null)
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState<number>(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)

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

  // Keyboard navigation & body scroll lock for Lightbox
  useEffect(() => {
    if (!previewMemory) return
    const photos = previewMemory.photos ?? []

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewMemory(null)
      } else if (e.key === 'ArrowLeft' && photos.length > 1) {
        setPreviewPhotoIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1))
      } else if (e.key === 'ArrowRight' && photos.length > 1) {
        setPreviewPhotoIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0))
      }
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [previewMemory])

  // Download photo handler
  const handleDownloadPhoto = (url: string, title: string, index: number) => {
    try {
      const a = document.createElement('a')
      a.href = url
      const safeTitle = (title || 'kenangan').replace(/[^a-zA-Z0-9_-]/g, '_')
      a.download = `${safeTitle}-${index + 1}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch {
      window.open(url, '_blank')
    }
  }

  // File handling for Add (Maksimal 10 foto)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const incoming = Array.from(e.target.files)
    setSelectedFiles(prev => {
      const combined = [...prev, ...incoming]
      if (combined.length > 10) {
        setPhotoLimitWarning('Maksimal 10 foto per kenangan ya!')
        toast.warning('Maksimal 10 foto per kenangan ya! 10 foto pertama tetap kami simpan.')
        setTimeout(() => setPhotoLimitWarning(''), 4000)
        return combined.slice(0, 10)
      }
      return combined
    })
    setAddErrors(p => ({ ...p, photos: undefined }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeSelectedFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx))
  }

  // File handling for Edit (Maksimal 10 foto total)
  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const incoming = Array.from(e.target.files)
    const maxAllowedNew = 10 - existingPhotos.length
    if (maxAllowedNew <= 0) {
      setPhotoLimitWarning('Sudah mencapai batas maksimal 10 foto. Hapus foto lama terlebih dahulu jika ingin menambah.')
      toast.warning('Sudah mencapai batas maksimal 10 foto per kenangan.')
      setTimeout(() => setPhotoLimitWarning(''), 4000)
      return
    }
    setNewEditFiles(prev => {
      const combined = [...prev, ...incoming]
      if (combined.length > maxAllowedNew) {
        setPhotoLimitWarning('Maksimal 10 foto per kenangan ya!')
        toast.warning('Maksimal 10 foto per kenangan ya!')
        setTimeout(() => setPhotoLimitWarning(''), 4000)
        return combined.slice(0, maxAllowedNew)
      }
      return combined
    })
    setEditErrors(p => ({ ...p, photos: undefined }))
    if (editFileInputRef.current) editFileInputRef.current.value = ''
  }

  const removeExistingPhoto = (idx: number) => {
    setExistingPhotos(prev => prev.filter((_, i) => i !== idx))
  }

  const removeNewEditFile = (idx: number) => {
    setNewEditFiles(prev => prev.filter((_, i) => i !== idx))
  }

  // Submit Add with full inline validation
  const handleSubmitMemory = async (e: React.FormEvent) => {
    e.preventDefault()

    const errs: { title?: string; date?: string; category?: string; photos?: string } = {}
    if (!title.trim()) errs.title = 'Judul kenangan wajib diisi'
    if (!date.trim()) errs.date = 'Tanggal kenangan wajib dipilih'
    if (!category.trim()) errs.category = 'Kategori wajib dipilih'
    if (selectedFiles.length === 0) errs.photos = 'Minimal unggah 1 foto kenangan'

    if (Object.keys(errs).length > 0) {
      setAddErrors(errs)
      return
    }
    if (!session || !params.roomId) return

    setAddErrors({})
    setUploading(true)
    setFormError('')

    try {
      const roomId = params.roomId
      const newMemoryRef = doc(collection(db, 'rooms', roomId, 'memories'))
      const memoryId = newMemoryRef.id

      let photos: PhotoItem[] = []
      if (selectedFiles.length > 0) {
        setUploadStatus(`Mengompres & menyimpan ${selectedFiles.length} foto...`)
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
      setAddErrors({})
      setShowAddModal(false)
      loadMemories()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal mengunggah kenangan.')
    } finally {
      setUploading(false)
      setUploadStatus('')
    }
  }

  // Start Edit
  const handleStartEdit = (memory: Memory) => {
    setEditingMemory(memory)
    setEditTitle(memory.title)
    setEditCaption(memory.caption || '')
    setEditDate(memory.date || new Date().toISOString().split('T')[0])
    setEditLocation(memory.location_name || '')
    setEditCategory(memory.category || 'Nongkrong')
    setExistingPhotos(memory.photos || (memory.memory_photos as PhotoItem[]) || [])
    setNewEditFiles([])
    setEditError('')
    setEditErrors({})
    setShowConfirmModal(false)
  }

  // Pre-confirm edit click with validation
  const handlePreSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: { title?: string; date?: string; category?: string; photos?: string } = {}
    if (!editTitle.trim()) errs.title = 'Judul kenangan wajib diisi'
    if (!editDate.trim()) errs.date = 'Tanggal kenangan wajib dipilih'
    if (!editCategory.trim()) errs.category = 'Kategori wajib dipilih'
    if (existingPhotos.length === 0 && newEditFiles.length === 0) {
      errs.photos = 'Minimal harus memiliki 1 foto kenangan'
    }

    if (Object.keys(errs).length > 0) {
      setEditErrors(errs)
      return
    }

    setEditErrors({})
    setEditError('')
    setShowConfirmModal(true)
  }

  // Final confirmed save edit
  const handleConfirmSaveEdit = async () => {
    if (!editingMemory || !params.roomId) return
    setSavingEdit(true)
    setEditError('')

    try {
      const roomId = params.roomId
      const memoryId = editingMemory.id

      // Upload new photos if any
      let newlyUploadedPhotos: PhotoItem[] = []
      if (newEditFiles.length > 0) {
        const uploadPromises = newEditFiles.map(async (file, i) => {
          const uploadRes = await uploadPhoto(file, roomId, memoryId)
          return {
            id: `${Date.now()}-new-${i}`,
            storage_path: uploadRes.storagePath,
            url: uploadRes.downloadUrl,
            sort_order: existingPhotos.length + i,
            is_cover: existingPhotos.length === 0 && i === 0,
          }
        })
        newlyUploadedPhotos = await Promise.all(uploadPromises)
      }

      const combinedPhotos = [...existingPhotos, ...newlyUploadedPhotos]
      if (combinedPhotos.length > 0) {
        combinedPhotos[0].is_cover = true
      }

      const memoryRef = doc(db, 'rooms', roomId, 'memories', memoryId)
      await updateDoc(memoryRef, {
        title: editTitle.trim(),
        caption: editCaption.trim() || null,
        date: editDate,
        location_name: editLocation.trim() || null,
        category: editCategory,
        photos: combinedPhotos,
        updated_at: new Date().toISOString(),
      })

      // Optimistic update locally
      setMemories(prev =>
        prev.map(m => {
          if (m.id !== memoryId) return m
          return {
            ...m,
            title: editTitle.trim(),
            caption: editCaption.trim() || null,
            date: editDate,
            location_name: editLocation.trim() || null,
            category: editCategory,
            photos: combinedPhotos,
          }
        })
      )

      setShowConfirmModal(false)
      setEditingMemory(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan kenangan.')
      setShowConfirmModal(false)
    } finally {
      setSavingEdit(false)
    }
  }

  // Delete Memory
  const handleConfirmDelete = async () => {
    if (!deletingMemory || !params.roomId) return
    setIsDeleting(true)
    try {
      // Hapus file fisik dari Firebase Storage terlebih dahulu
      if (deletingMemory.photos && deletingMemory.photos.length > 0) {
        for (const photo of deletingMemory.photos) {
          if (photo.storage_path && photo.storage_path !== 'embedded') {
            await deleteStorageFile(photo.storage_path).catch(() => {})
          }
        }
      }

      await deleteDoc(doc(db, 'rooms', params.roomId, 'memories', deletingMemory.id))
      setMemories(prev => prev.filter(m => m.id !== deletingMemory.id))
      setDeletingMemory(null)
    } catch (err) {
      console.error('Delete memory error:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  // Toggle Reaction
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

  const FILTER_ITEMS = [
    { id: 'all',       label: 'Semua Momen',   dotColor: undefined },
    { id: 'Nongkrong', label: 'Nongkrong',  dotColor: CATEGORY_STYLES['Nongkrong']?.dot },
    { id: 'Liburan',   label: 'Liburan',   dotColor: CATEGORY_STYLES['Liburan']?.dot },
    { id: 'Kuliner',   label: 'Kuliner',    dotColor: CATEGORY_STYLES['Kuliner']?.dot },
    { id: 'Perayaan',  label: 'Perayaan',   dotColor: CATEGORY_STYLES['Perayaan']?.dot },
    { id: 'Random',    label: 'Random',      dotColor: CATEGORY_STYLES['Random']?.dot },
  ]

  const filteredMemories = filterCategory === 'all'
    ? memories
    : memories.filter(m => m.category === filterCategory)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5 select-none">
      {/* ── Card 1: Page Header Card (Lega, Spacing 12-16px, Padding 24-28px) ── */}
      <PageHeaderCard
        badge={{ text: 'Koleksi Momen Bahagia', icon: Sparkles }}
        title="📸 Galeri Kenangan Bersama"
        description="Setiap gambar menyimpan ribuan tawa dan cerita indah yang kita lalui bersama."
        cta={{
          label: 'Tambah Kenangan Baru',
          icon: Plus,
          onClick: () => {
            setAddErrors({})
            setFormError('')
            setPhotoLimitWarning('')
            setShowAddModal(true)
          },
        }}
      />

      {/* ── Card 2: Filter Kategori (Scrollable Horizontal di Mobile dengan Fade Kanan) ── */}
      <CategoryFilterBar
        categories={FILTER_ITEMS}
        selectedId={filterCategory}
        onSelect={(id) => setFilterCategory(id)}
        label="Filter Momen"
      />

      {/* Memories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-80 skeleton rounded-3xl" />
          ))}
        </div>
      ) : filteredMemories.length === 0 ? (
        <div
          className="text-center py-16 px-4 border-2 border-dashed rounded-3xl space-y-4"
          style={{ borderColor: 'var(--color-line)', background: 'var(--color-surface)' }}
        >
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center border"
            style={{ background: 'var(--color-sunken)', borderColor: 'var(--color-line)' }}
          >
            <ImageIcon className="w-9 h-9 text-[var(--color-clay)]" />
          </div>
          <div>
            <h3
              className="text-base font-bold text-[var(--color-ink)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Belum ada kenangan di sini
            </h3>
            <p className="text-xs mt-1.5 max-w-xs mx-auto text-[var(--color-ink-soft)]">
              Jadilah yang pertama mengabadikan foto dan momen bersama orang-orang tersayang!
            </p>
          </div>
            <DSButton
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold hover:opacity-90 transition-opacity text-[var(--color-white)]"
            style={{ background: 'var(--color-clay)', boxShadow: '0 2px 8px var(--color-clay-shadow-soft)' }}
          >
            <Plus className="w-4 h-4" /> Tambah Kenangan Sekarang
            </DSButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMemories.map(m => {
            const photos = m.photos || (m.memory_photos as PhotoItem[]) || []
            const cover = photos[0]?.url || photos[0]?.storage_path
            const memberLikes = m.likes || []
            const hasLiked = session ? memberLikes.includes(session.id) : false
            const likesCount = memberLikes.length
            const catStyle = CATEGORY_STYLES[m.category ?? ''] || CATEGORY_STYLES['Random']
            // Rotasi deterministik dari id memori ±1.2°
            const hashCode = m.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
            const rotation = ((hashCode % 24) - 12) / 10

            return (
              <div
                key={m.id}
                className="group rounded-xl overflow-hidden transition-colors duration-300 flex flex-col relative"
                style={{
                  background: 'var(--color-surface)',
                  border: '1.5px solid var(--color-line)',
                  boxShadow: 'var(--shadow-card)',
                  transform: `rotate(${rotation}deg)`,
                }}
              >
                {/* Strip warna kategori atas */}
                <div
                  className="h-1 w-full shrink-0"
                  style={{ background: catStyle.dot }}
                />

                {/* Foto — klik untuk lightbox */}
                <div
                  onClick={() => {
                    if (photos.length > 0) { setPreviewMemory(m); setPreviewPhotoIndex(0) }
                  }}
                  className={`relative aspect-[4/3] overflow-hidden bg-[var(--color-sunken)] ${
                    photos.length > 0 ? 'cursor-pointer group/photo' : ''
                  }`}
                >
                  {/* Bingkai cetak putih di dalam foto */}
                  {cover ? (
                    <img
                      src={getMediaUrl(cover)}
                      alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-line)]">
                      <Camera className="w-10 h-10 opacity-40 mb-1" />
                      <span className="text-[11px] font-semibold opacity-50">Tanpa Foto</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />

                  {/* Hover overlay */}
                  {photos.length > 0 && (
                    <div className="absolute inset-0 bg-[var(--color-overlay-soft)] opacity-0 group-hover/photo:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                      <div
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg translate-y-1.5 group-hover/photo:translate-y-0 transition-transform duration-300"
                        style={{ background: 'var(--color-white-surface-strong)', color: 'var(--color-ink)' }}
                      >
                        <Eye className="w-3.5 h-3.5 text-[var(--color-clay)]" />
                        Lihat Foto
                      </div>
                    </div>
                  )}

                  {/* Badge kategori */}
                  {m.category && (
                    <span
                      className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"
                      style={{ background: catStyle.bg, color: catStyle.text }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: catStyle.dot }} />
                      {m.category}
                    </span>
                  )}

                  {/* Tombol Edit & Hapus */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStartEdit(m) }}
                      title="Edit Kenangan"
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-md"
                      style={{ background: 'var(--color-white-surface)', color: 'var(--color-ink)' }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingMemory(m) }}
                      title="Hapus Kenangan"
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-md"
                      style={{ background: 'var(--color-white-surface)', color: 'var(--color-error)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Indikator multi-foto */}
                  {photos.length > 1 && (
                    <span
                      className="absolute bottom-9 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1"
                      style={{ background: 'var(--color-overlay)', color: 'var(--color-white)' }}
                    >
                      <ImageIcon className="w-3 h-3" />+{photos.length - 1}
                    </span>
                  )}

                  {/* Judul di atas foto */}
                  <div className="absolute bottom-2.5 left-3 right-3 text-[var(--color-white)] z-10">
                    <h3 className="text-sm font-bold leading-snug drop-shadow truncate">
                      {m.title}
                    </h3>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  {/* Caption */}
                  <div>
                    {m.caption ? (
                      <p className="text-xs line-clamp-2 leading-relaxed text-[var(--color-ink-soft)]">
                        &ldquo;{m.caption}&rdquo;
                      </p>
                    ) : (
                      <p className="text-xs italic text-[var(--color-line)]">Tidak ada catatan.</p>
                    )}
                  </div>

                  {/* Meta & Like */}
                  <div
                    className="pt-2.5 flex items-center justify-between text-[11px] border-t"
                    style={{ borderColor: 'var(--color-line)' }}
                  >
                    <div className="flex items-center gap-3 text-[var(--color-ink-soft)]">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-[var(--color-clay)]" />
                        {m.date}
                      </span>
                      {m.location_name && (
                        <span className="flex items-center gap-1 truncate max-w-[110px] font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[var(--color-ink-soft)]" />
                          {m.location_name}
                        </span>
                      )}
                    </div>

                    {/* Tombol Like */}
                    <button
                      onClick={() => handleToggleReaction(m.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors cursor-pointer border"
                      style={{
                        background: hasLiked ? 'var(--color-heart-tint)' : 'var(--color-sunken)',
                        color: hasLiked ? 'var(--color-heart)' : 'var(--color-ink-soft)',
                        borderColor: hasLiked ? 'var(--color-heart-line)' : 'var(--color-line)',
                      }}
                    >
                      <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                      {likesCount > 0 && <span className="font-bold text-xs">{likesCount}</span>}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal Tambah Kenangan ── */}
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
            <div
              className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: 'var(--color-line)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center border"
                  style={{ background: 'var(--color-sunken)', borderColor: 'var(--color-line)' }}
                >
                  <Plus className="w-5 h-5 text-[var(--color-clay)]" />
                </div>
                <div>
                  <h2
                    className="text-base font-bold leading-tight text-[var(--color-ink)]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Abadikan Kenangan Baru
                  </h2>
                  <p className="text-[11px] text-[var(--color-ink-soft)]">Simpan momen hari ini bersama sahabat</p>
                </div>
              </div>
              <button
                onClick={() => !uploading && setShowAddModal(false)}
                className="p-1.5 rounded-xl text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-sunken)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div
                className="p-3 rounded-2xl text-xs font-semibold border flex items-center gap-2"
                style={{ background: 'var(--color-danger-tint)', color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitMemory} className="space-y-4">
              {/* Judul */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-ink-soft)] mb-1.5">
                  Judul Momen <span className="text-[var(--color-error)]">*</span>
                </label>
                  <DSInput
                  type="text"
                  value={title}
                  onChange={e => {
                    setTitle(e.target.value)
                    if (addErrors.title) setAddErrors(p => ({ ...p, title: undefined }))
                  }}
                  placeholder="Contoh: Liburan ke Dufan, Nonton Konser Bareng"
                  className="w-full px-3.5 py-2.5 rounded-2xl text-xs outline-none transition-colors select-text"
                  style={{
                    background: 'var(--color-sunken)',
                    border: addErrors.title ? '1.5px solid var(--color-error)' : '1.5px solid var(--color-line)',
                    color: 'var(--color-ink)',
                  }}
                />
                {addErrors.title && (
                  <p className="mt-1.5 text-[11px] font-medium flex items-center gap-1" style={{ color: 'var(--color-error)' }}>
                    <AlertCircle className="w-3 h-3 shrink-0" /><span>{addErrors.title}</span>
                  </p>
                )}
              </div>

              {/* Caption */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-ink-soft)] mb-1.5">
                  Cerita / Catatan
                </label>
                  <DSTextarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  rows={3}
                  placeholder="Tuliskan cerita singkat tentang apa yang membuat momen ini berkesan..."
                  className="w-full px-3.5 py-2.5 rounded-2xl text-xs outline-none transition-colors resize-none select-text"
                  style={{
                    background: 'var(--color-sunken)',
                    border: '1.5px solid var(--color-line)',
                    color: 'var(--color-ink)',
                  }}
                />
              </div>

              {/* Tanggal & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <DatePicker
                    label="Tanggal *"
                    value={date}
                    onChange={newDate => {
                      setDate(newDate)
                      if (addErrors.date) setAddErrors(p => ({ ...p, date: undefined }))
                    }}
                  />
                  {addErrors.date && (
                    <p className="mt-1.5 text-[11px] font-medium flex items-center gap-1" style={{ color: 'var(--color-error)' }}>
                      <AlertCircle className="w-3 h-3 shrink-0" /><span>{addErrors.date}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--color-ink-soft)] mb-1.5">
                    Kategori <span className="text-[var(--color-error)]">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={e => {
                      setCategory(e.target.value)
                      if (addErrors.category) setAddErrors(p => ({ ...p, category: undefined }))
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl text-xs outline-none transition-colors cursor-pointer font-medium"
                    style={{
                      background: 'var(--color-sunken)',
                      border: addErrors.category ? '1.5px solid var(--color-error)' : '1.5px solid var(--color-line)',
                      color: 'var(--color-ink)',
                    }}
                  >
                    <option value="Nongkrong">Nongkrong</option>
                    <option value="Liburan">Liburan</option>
                    <option value="Kuliner">Kuliner</option>
                    <option value="Perayaan">Perayaan</option>
                    <option value="Random">Random</option>
                  </select>
                  {addErrors.category && (
                    <p className="mt-1.5 text-[11px] font-medium flex items-center gap-1" style={{ color: 'var(--color-error)' }}>
                      <AlertCircle className="w-3 h-3 shrink-0" /><span>{addErrors.category}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Lokasi */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-ink-soft)] mb-1.5">
                  Lokasi
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={e => setLocationName(e.target.value)}
                  placeholder="Contoh: Dufan Ancol, Kopi Kenangan Senopati..."
                  className="w-full px-3.5 py-2.5 rounded-2xl text-xs outline-none transition-colors select-text"
                  style={{
                    background: 'var(--color-sunken)',
                    border: '1.5px solid var(--color-line)',
                    color: 'var(--color-ink)',
                  }}
                />
              </div>

              {/* Upload Foto (Maks 10 foto) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-[var(--color-ink-soft)]">
                    Foto Kenangan <span className="text-[var(--color-error)]">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-[var(--color-ink-soft)]">
                    {selectedFiles.length} / 10 foto dipilih
                  </span>
                </div>

                {photoLimitWarning && (
                  <div
                    className="mb-2 p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in"
                    style={{
                      background: 'var(--color-honey)',
                      color: 'var(--color-ink)',
                      borderColor: 'var(--color-honey-line)',
                    }}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{photoLimitWarning}</span>
                  </div>
                )}

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
                  className={`w-full py-5 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer group ${
                    addErrors.photos
                      ? 'border-[var(--color-error)] bg-[var(--color-danger-tint)]'
                      : 'border-[var(--color-line)] bg-[var(--color-sunken)] hover:border-[var(--color-clay)]'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-transform"
                    style={{ background: 'var(--color-clay-tint)', color: 'var(--color-clay)' }}
                  >
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <span className="font-semibold">Pilih foto dari galeri (maks 10)</span>
                  <span className="text-[10px] text-[var(--color-ink-soft)]">Mendukung multi-foto sekaligus</span>
                </button>

                {addErrors.photos && (
                  <p className="mt-1.5 text-[11px] font-medium flex items-center gap-1" style={{ color: 'var(--color-error)' }}>
                    <AlertCircle className="w-3 h-3 shrink-0" /><span>{addErrors.photos}</span>
                  </p>
                )}

                {selectedFiles.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mt-3">
                    {selectedFiles.map((f, i) => {
                      const objectUrl = URL.createObjectURL(f)
                      return (
                        <div
                          key={i}
                          className="group relative aspect-square rounded-xl overflow-hidden border-2 bg-[var(--color-sunken)]"
                          style={{ borderColor: 'var(--color-line)' }}
                        >
                          <img
                            src={objectUrl}
                            alt={f.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                          <span className="absolute bottom-1 left-1.5 text-[9px] font-bold text-[var(--color-white)] drop-shadow truncate max-w-[80%]">
                            Foto {i + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(i)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow-sm cursor-pointer"
                            style={{ background: 'var(--color-overlay)', color: 'var(--color-white)' }}
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

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t" style={{ borderColor: 'var(--color-line)' }}>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  style={{ color: 'var(--color-ink-soft)' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2.5 rounded-full text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-60 cursor-pointer hover:opacity-95 shadow-sm text-[var(--color-white)]"
                  style={{
                    background: 'var(--color-clay)',
                    border: '1px solid var(--color-clay-deep)',
                    boxShadow: '0 2px 8px var(--color-clay-shadow)',
                  }}
                >
                  {uploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>{uploadStatus || 'Menyimpan...'}</span></>
                  ) : (
                    'Simpan Kenangan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Edit Kenangan ── */}
      {editingMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)] backdrop-blur-xs animate-in fade-in">
          <div
            className="rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            style={{
              background: 'var(--color-white)',
              border: '1.5px solid rgba(255, 180, 162, 0.65)',
              boxShadow: '0 20px 50px -10px rgba(255, 140, 105, 0.35)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
                  style={{ background: 'var(--gradient-plan)' }}
                >
                  <Pencil className="w-5 h-5 text-[var(--color-ink)]" />
                </div>
                <div>
                  <h2
                    className="text-base font-bold leading-tight text-[var(--color-ink)]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Edit Kenangan & Foto
                  </h2>
                  <p className="text-[11px] text-[var(--text-secondary)]">Perbarui detail momen atau atur foto kenangan</p>
                </div>
              </div>
              <button
                onClick={() => setEditingMemory(null)}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-2xl bg-[var(--color-danger-tint)] border border-[var(--color-error)] text-[var(--color-error-strong)] text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[var(--color-error-bright)]" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handlePreSaveEdit} className="space-y-4">
              {/* Judul */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                  Judul Momen <span className="text-[var(--color-error-bright)]">*</span>
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => {
                    setEditTitle(e.target.value)
                    if (editErrors.title) setEditErrors(p => ({ ...p, title: undefined }))
                  }}
                  placeholder="Judul kenangan..."
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-xs text-[var(--text-primary)] outline-none transition-colors select-text ${
                    editErrors.title
                      ? 'bg-[var(--color-danger-tint)] border border-[var(--color-error-bright)] focus:border-[var(--color-error-bright)] focus:ring-2 focus:ring-[var(--color-error)]/20'
                      : 'bg-[var(--color-sunken)] border border-[var(--color-line)] focus:border-[var(--color-clay)] focus:ring-2 focus:ring-[var(--color-clay)]/40'
                  }`}
                />
                {editErrors.title && (
                  <p className="mt-1.5 text-[11px] text-[var(--color-error-bright)] font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{editErrors.title}</span>
                  </p>
                )}
              </div>

              {/* Catatan / Caption */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                  Cerita / Catatan
                </label>
                <textarea
                  value={editCaption}
                  onChange={e => setEditCaption(e.target.value)}
                  rows={3}
                  placeholder="Cerita singkat momen ini..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--color-sunken)] border border-[var(--color-line)] text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-clay)] focus:ring-2 focus:ring-[var(--color-clay)]/40 transition-colors resize-none select-text"
                />
              </div>

              {/* Tanggal & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <DatePicker
                    label="Tanggal *"
                    value={editDate}
                    onChange={newDate => {
                      setEditDate(newDate)
                      if (editErrors.date) setEditErrors(p => ({ ...p, date: undefined }))
                    }}
                  />
                  {editErrors.date && (
                    <p className="mt-1.5 text-[11px] text-[var(--color-error-bright)] font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{editErrors.date}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                    Kategori <span className="text-[var(--color-error-bright)]">*</span>
                  </label>
                  <select
                    value={editCategory}
                    onChange={e => {
                      setEditCategory(e.target.value)
                      if (editErrors.category) setEditErrors(p => ({ ...p, category: undefined }))
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-2xl text-xs text-[var(--text-primary)] outline-none transition-colors cursor-pointer font-medium ${
                      editErrors.category
                        ? 'bg-[var(--color-danger-tint)] border border-[var(--color-error-bright)] focus:border-[var(--color-error-bright)]'
                        : 'bg-[var(--color-sunken)] border border-[var(--color-line)] focus:border-[var(--color-clay)] focus:ring-2 focus:ring-[var(--color-clay)]/40'
                    }`}
                  >
                    <option value="Nongkrong">Nongkrong</option>
                    <option value="Liburan">Liburan</option>
                    <option value="Kuliner">Kuliner</option>
                    <option value="Perayaan">Perayaan</option>
                    <option value="Random">Random</option>
                  </select>
                  {editErrors.category && (
                    <p className="mt-1.5 text-[11px] text-[var(--color-error-bright)] font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{editErrors.category}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Lokasi */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">
                  Lokasi
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  placeholder="Lokasi tempat..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--color-sunken)] border border-[var(--color-line)] text-xs text-[var(--color-ink)] outline-none focus:border-[var(--color-clay)] focus:ring-2 focus:ring-[var(--color-clay)]/40 transition-colors select-text"
                />
              </div>

              {/* Foto yang Sudah Ada & Tambah Foto (Maks 10 foto total) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-[var(--text-secondary)]">
                    Foto Kenangan <span className="text-[var(--color-error-bright)]">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                    {existingPhotos.length + newEditFiles.length} / 10 foto tersimpan
                  </span>
                </div>

                {/* Toast Peringatan Batas Maksimal Foto */}
                {photoLimitWarning && (
                  <div className="mb-2 p-2.5 rounded-xl bg-[var(--color-warning-tint)] border border-[var(--color-honey)] text-[var(--color-warning-text)] text-xs font-medium flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-[var(--color-warning-text)] shrink-0" />
                    <span>{photoLimitWarning}</span>
                  </div>
                )}

                {editErrors.photos && (
                  <p className="mb-2 text-[11px] text-[var(--color-error-bright)] font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{editErrors.photos}</span>
                  </p>
                )}

                {existingPhotos.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] italic mb-2">Tidak ada foto lama tersimpan.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-3">
                    {existingPhotos.map((p, i) => (
                      <div
                        key={p.id || i}
                        className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-[var(--border)] shadow-2xs bg-[var(--surface-elevated)]"
                      >
                        <img
                          src={getMediaUrl(p.url || p.storage_path)}
                          alt={`Foto ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-[var(--color-overlay)] text-[var(--color-white)] text-[8px] font-bold">
                            Sampul
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeExistingPhoto(i)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[var(--color-overlay)] hover:bg-[var(--color-error)] text-[var(--color-white)] flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                          title="Hapus foto ini"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tambah Foto Baru */}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={editFileInputRef}
                  onChange={handleEditFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => editFileInputRef.current?.click()}
                  className="w-full py-3.5 border-2 border-dashed border-[var(--color-clay)]/60 hover:border-[var(--color-clay)] rounded-2xl flex items-center justify-center gap-2 text-xs text-[var(--color-ink-soft)] bg-[var(--color-clay-tint)]/20 hover:bg-[var(--color-clay-tint)]/40 transition-colors cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-[var(--color-clay)]" />
                  <span className="font-semibold text-[var(--color-ink)]">Pilih foto tambahan (maks 10 total)</span>
                </button>

                {newEditFiles.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mt-2.5">
                    {newEditFiles.map((f, i) => {
                      const objectUrl = URL.createObjectURL(f)
                      return (
                        <div
                          key={i}
                          className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-[var(--color-clay)] shadow-xs bg-[var(--color-surface)]"
                        >
                          <img
                            src={objectUrl}
                            alt={f.name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 left-1.5 text-[8px] font-bold text-[var(--color-white)] bg-[var(--color-overlay)] px-1 rounded-sm">
                            Baru
                          </span>
                          <button
                            type="button"
                            onClick={() => removeNewEditFile(i)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[var(--color-overlay)] hover:bg-[var(--color-error)] text-[var(--color-white)] flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                            title="Batal tambah foto"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setEditingMemory(null)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer hover:opacity-95 shadow-sm"
                  style={{
                    background: 'var(--gradient-plan)',
                    color: 'var(--color-ink)',
                    boxShadow: '0 4px 14px rgba(255, 217, 125, 0.4)',
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Dialog Konfirmasi Sebelum Menyimpan Edit ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[var(--color-overlay)] backdrop-blur-xs animate-in fade-in">
          <div
            className="rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-center animate-fade-in-up"
            style={{
              background: 'var(--color-white)',
              border: '2px solid rgba(255, 217, 125, 0.8)',
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            <div
              className="w-14 h-14 rounded-full mx-auto flex items-center justify-center shadow-xs"
              style={{ background: 'var(--color-clay-tint)' }}
            >
              <HelpCircle className="w-8 h-8 text-[var(--color-clay)]" />
            </div>

            <div>
              <h3
                className="text-base font-bold text-[var(--color-ink)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Konfirmasi Perubahan
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                Apakah kamu yakin ingin menyimpan perubahan pada kenangan <span className="font-bold text-[var(--color-ink)]">&ldquo;{editTitle}&rdquo;</span>?
              </p>
            </div>

            <div className="bg-[var(--surface-elevated)] p-3 rounded-2xl text-[11px] text-left space-y-1 text-[var(--text-secondary)]">
              <p><strong>Tanggal:</strong> {editDate}</p>
              <p><strong>Kategori:</strong> {editCategory}</p>
              <p><strong>Total Foto:</strong> {existingPhotos.length + newEditFiles.length} foto</p>
              {editLocation && <p><strong>Lokasi:</strong> {editLocation}</p>}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={savingEdit}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-[var(--text-secondary)] bg-[var(--surface-elevated)] hover:bg-[var(--border)] transition-colors cursor-pointer"
              >
                Periksa Lagi
              </button>
              <button
                type="button"
                disabled={savingEdit}
                onClick={handleConfirmSaveEdit}
                    className="flex-1 py-2.5 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-95 shadow-sm text-[var(--color-ink)] disabled:opacity-50"
                style={{ background: 'var(--gradient-memory)' }}
              >
                {savingEdit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[var(--color-success-deep)]" />
                    <span>Ya, Simpan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog Konfirmasi Hapus Kenangan ── */}
      {deletingMemory && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[var(--color-overlay)] backdrop-blur-xs animate-in fade-in">
          <div
            className="rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-center animate-fade-in-up"
            style={{
              background: 'var(--color-white)',
              border: '2px solid rgba(248, 113, 113, 0.4)',
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center bg-[var(--color-danger-tint)] text-[var(--color-error)]">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[var(--color-ink)]">
                Hapus Kenangan Ini?
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                Kenangan <span className="font-bold text-[var(--danger)]">&ldquo;{deletingMemory.title}&rdquo;</span> beserta foto-fotonya akan dihapus dari ruang kenangan. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingMemory(null)}
                className="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-[var(--text-secondary)] bg-[var(--surface-elevated)] hover:bg-[var(--border)] transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90 shadow-sm bg-[var(--danger)] text-[var(--color-white)] disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--color-white)]" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  'Ya, Hapus'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Modern Clean Minimalist Photo Lightbox ── */}
      {previewMemory && (
        <div
          className="fixed inset-0 z-70 flex flex-col items-center justify-between p-3 sm:p-6 bg-[var(--color-overlay-strong)] backdrop-blur-md animate-fade-in-fast select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewMemory(null)
          }}
        >
          {/* Header Bar */}
              <div className="w-full max-w-4xl flex items-center justify-between text-[var(--color-white)] py-1.5 z-10">
            <div className="flex items-center gap-2">
              {previewMemory.category && (
                <span
                  className="px-2.5 py-1 rounded-xl text-[10px] font-bold shadow-xs backdrop-blur-md"
                  style={{
                    background: CATEGORY_STYLES[previewMemory.category]?.bg || 'rgba(255,255,255,0.2)',
                    color: CATEGORY_STYLES[previewMemory.category]?.text || 'var(--color-white)',
                  }}
                >
                  {previewMemory.category}
                </span>
              )}
              <span className="text-xs text-[var(--color-white-faint)] font-medium">
                {(previewMemory.photos ?? []).length > 1
                  ? `${previewPhotoIndex + 1} / ${(previewMemory.photos ?? []).length} Foto`
                  : 'Foto Kenangan'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Download Photo Button */}
              {previewMemory.photos && previewMemory.photos[previewPhotoIndex] && (
                <button
                  type="button"
                  onClick={() => {
                    const activeP = previewMemory.photos![previewPhotoIndex]
                    const url = getMediaUrl(activeP.url || activeP.storage_path)
                    handleDownloadPhoto(url, previewMemory.title, previewPhotoIndex)
                  }}
                  className="w-9 h-9 rounded-full bg-[var(--color-white-soft)] hover:bg-[var(--color-white)] text-[var(--color-white)] backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                  title="Unduh Foto Kenangan"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setPreviewMemory(null)}
                className="w-9 h-9 rounded-full bg-[var(--color-white-soft)] hover:bg-[var(--color-white)] text-[var(--color-white)] backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Photo Area with Navigation Arrows */}
          <div
            className="relative flex-1 w-full max-w-4xl flex items-center justify-center my-auto min-h-0 py-2"
            onClick={(e) => {
              if (e.target === e.currentTarget) setPreviewMemory(null)
            }}
          >
            {/* Previous Arrow Button */}
            {(previewMemory.photos ?? []).length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setPreviewPhotoIndex((prev) =>
                    prev > 0 ? prev - 1 : (previewMemory.photos?.length || 1) - 1
                  )
                }}
                className="absolute left-1 sm:left-3 z-20 w-11 h-11 rounded-full bg-[var(--color-overlay)] hover:bg-[var(--color-overlay-strong)] text-[var(--color-white)] backdrop-blur-md flex items-center justify-center transition-colors shadow-xl border border-[var(--color-white-soft)] cursor-pointer"
                title="Foto Sebelumnya (←)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Photo Element */}
            <div className="animate-lightbox-in flex items-center justify-center max-h-full max-w-full">
              {previewMemory.photos && previewMemory.photos[previewPhotoIndex] ? (
                <img
                  key={`${previewMemory.id}-${previewPhotoIndex}`}
                  src={getMediaUrl(
                    previewMemory.photos[previewPhotoIndex].url ||
                    previewMemory.photos[previewPhotoIndex].storage_path
                  )}
                  alt={previewMemory.title}
                  className="max-h-[62vh] sm:max-h-[70vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl transition-opacity duration-300"
                  style={{
                    boxShadow: 'var(--shadow-modal)',
                  }}
                />
              ) : (
                <div className="w-64 h-64 rounded-2xl bg-[var(--color-white-soft)] flex flex-col items-center justify-center text-[var(--color-white-faint)]">
                  <Camera className="w-12 h-12 mb-2 opacity-50" />
                  <span className="text-xs">Foto tidak tersedia</span>
                </div>
              )}
            </div>

            {/* Next Arrow Button */}
            {(previewMemory.photos ?? []).length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setPreviewPhotoIndex((prev) =>
                    prev < (previewMemory.photos?.length || 1) - 1 ? prev + 1 : 0
                  )
                }}
                className="absolute right-1 sm:right-3 z-20 w-11 h-11 rounded-full bg-[var(--color-overlay)] hover:bg-[var(--color-overlay-strong)] text-[var(--color-white)] backdrop-blur-md flex items-center justify-center transition-colors shadow-xl border border-[var(--color-white-soft)] cursor-pointer"
                title="Foto Selanjutnya (→)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Dots Indicator */}
          {(previewMemory.photos ?? []).length > 1 && (
            <div className="flex items-center gap-1.5 py-1 z-10">
              {previewMemory.photos!.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPreviewPhotoIndex(idx)}
                  className={`h-2 rounded-full transition-colors duration-300 cursor-pointer ${
                    idx === previewPhotoIndex
                      ? 'w-6 bg-[var(--color-white)] shadow-xs'
                      : 'w-2 bg-[var(--color-white-soft)] hover:bg-[var(--color-white)]'
                  }`}
                  title={`Foto ke-${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Bottom Floating Info Card */}
          <div className="w-full max-w-2xl px-4 py-3 rounded-2xl bg-[var(--color-overlay)] backdrop-blur-md border border-[var(--color-white-soft)] text-[var(--color-white)] space-y-1.5 shadow-2xl z-10 mt-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm sm:text-base font-bold truncate text-[var(--color-white)] drop-shadow-xs">
                {previewMemory.title}
              </h2>
              <div className="flex items-center gap-2.5 text-[11px] text-[var(--color-white-faint)] shrink-0 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[var(--color-honey)]" />
                  {previewMemory.date}
                </span>
                {previewMemory.location_name && (
                  <span className="flex items-center gap-1 truncate max-w-[150px]">
                    <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
                    {previewMemory.location_name}
                  </span>
                )}
              </div>
            </div>

            {previewMemory.caption && (
              <p className="text-xs text-[var(--color-white)] line-clamp-3 leading-relaxed italic pt-1 border-t border-[var(--color-white-soft)]">
                &ldquo;{previewMemory.caption}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


