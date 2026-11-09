import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../firebase/client'

export interface UploadResult {
  storagePath: string
  downloadUrl: string
}

/**
 * Kompresi gambar sisi klien ke format WebP berkualitas 82% (target < 500 KB).
 * Mengurangi beban kuota hingga 80% sebelum dikirim ke Firebase Storage.
 */
export async function compressImageToWebP(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82
): Promise<Blob> {
  if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
    return file
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUri = e.target?.result as string
      if (!dataUri) {
        resolve(file)
        return
      }

      const img = new Image()
      img.onload = () => {
        try {
          let { width, height } = img

          // Batasi dimensi maksimum dengan menjaga aspek rasio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width)
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height)
              height = maxHeight
            }
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(file)
            return
          }

          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, width, height)

          // Coba ekspor ke image/webp terlebih dahulu
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                // Fallback ke JPEG jika browser tidak mendukung toBlob WebP
                canvas.toBlob(
                  (fallbackBlob) => resolve(fallbackBlob || file),
                  'image/jpeg',
                  quality
                )
              }
            },
            'image/webp',
            quality
          )
        } catch {
          resolve(file)
        }
      }
      img.onerror = () => resolve(file)
      img.src = dataUri
    }
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'))
    reader.readAsDataURL(file)
  })
}

/**
 * Mengunggah foto kenangan ke Firebase Cloud Storage resmi.
 * Path: rooms/{roomId}/memories/{memoryId}/{photoId}.webp
 */
export async function uploadPhoto(
  file: File,
  roomId: string,
  memoryId: string
): Promise<UploadResult> {
  const photoId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  const storagePath = `rooms/${roomId}/memories/${memoryId}/${photoId}.webp`

  try {
    // 1. Kompresi WebP di browser (<500 KB)
    const compressedBlob = await compressImageToWebP(file, 1600, 1600, 0.82)

    // 2. Unggah ke Cloud Storage
    const storageRef = ref(storage, storagePath)
    await uploadBytes(storageRef, compressedBlob, {
      contentType: 'image/webp',
      customMetadata: {
        roomId,
        memoryId,
        uploadedAt: new Date().toISOString(),
      },
    })

    // 3. Dapatkan Download URL resmi
    const downloadUrl = await getDownloadURL(storageRef)

    return {
      storagePath,
      downloadUrl,
    }
  } catch (err) {
    console.warn('Firebase Storage upload notice (falling back if offline/unconfigured):', err)
    // Fallback darurat (misal konfigurasi storage belum aktif saat staging)
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () =>
        resolve({
          storagePath: 'embedded',
          downloadUrl: (reader.result as string) || '',
        })
      reader.onerror = () =>
        resolve({
          storagePath: 'embedded',
          downloadUrl: '',
        })
      reader.readAsDataURL(file)
    })
  }
}

/**
 * Menghapus file foto dari Firebase Cloud Storage untuk mencegah file yatim (orphaned files).
 */
export async function deleteStorageFile(storagePathOrUrl?: string | null): Promise<void> {
  if (!storagePathOrUrl || storagePathOrUrl === 'embedded' || storagePathOrUrl.startsWith('data:')) {
    return
  }

  try {
    const fileRef = ref(storage, storagePathOrUrl)
    await deleteObject(fileRef)
  } catch (err) {
    // Abaikan jika file sudah tidak ada
    console.warn('Gagal menghapus file storage (mungkin sudah terhapus):', err)
  }
}

export function getMediaUrl(storagePathOrUrl?: string | null): string {
  if (!storagePathOrUrl) return ''
  return storagePathOrUrl
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/')
}

export async function getSignedMusicUrl(storagePath: string): Promise<string> {
  return storagePath || ''
}
