'use client'

export interface UploadResult {
  storagePath: string
  downloadUrl: string
}

// ─── Fast Native Canvas Image Compressor (100% Free, No Credit Card / Blaze Plan Needed) ───
export async function compressImageToDataUrl(
  file: File,
  maxWidth = 720,
  maxHeight = 720,
  quality = 0.65
): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string) || '')
      reader.onerror = () => resolve('')
      reader.readAsDataURL(file)
      return
    }

    const reader = new FileReader()
    reader.onload = (readerEvent) => {
      const dataUri = readerEvent.target?.result as string
      if (!dataUri) {
        resolve('')
        return
      }

      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          let { width, height } = img

          // Maintain aspect ratio within max dimensions
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

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(dataUri)
            return
          }

          // Smooth rendering
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, width, height)

          // Compressed to JPEG 0.65 (~30KB to 45KB per photo)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
          resolve(compressedDataUrl)
        } catch {
          resolve(dataUri)
        }
      }
      img.onerror = () => resolve(dataUri)
      img.src = dataUri
    }
    reader.onerror = () => resolve('')
    reader.readAsDataURL(file)
  })
}

// ─── Photo upload (Instant, 100% Free client-side compression) ───
export async function uploadPhoto(
  file: File,
  _roomId: string,
  _memoryId: string
): Promise<UploadResult> {
  // Compress in browser memory in ~100ms
  const compressedUrl = await compressImageToDataUrl(file, 720, 720, 0.65)
  return {
    storagePath: 'embedded',
    downloadUrl: compressedUrl,
  }
}

// ─── Backward compatibility helpers ──────────────────────────
export async function fileToDataUrl(file: File): Promise<string> {
  return compressImageToDataUrl(file, 720, 720, 0.65)
}

export async function uploadVideo(
  file: File,
  _roomId: string,
  _memoryId: string
): Promise<UploadResult> {
  const url = await compressImageToDataUrl(file)
  return { storagePath: 'embedded', downloadUrl: url }
}

export async function uploadMusic(
  file: File,
  _roomId: string
): Promise<UploadResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ storagePath: 'embedded', downloadUrl: reader.result as string })
    reader.onerror = () => resolve({ storagePath: 'embedded', downloadUrl: '' })
    reader.readAsDataURL(file)
  })
}

export async function getSignedMusicUrl(storagePath: string): Promise<string> {
  return storagePath || ''
}

export async function deleteStorageFile(_storagePathOrUrl: string): Promise<void> {
  // Embedded data URLs are automatically cleaned up when the Firestore document is deleted
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/')
}

export function getMediaUrl(storagePathOrUrl?: string | null): string {
  if (!storagePathOrUrl) return ''
  return storagePathOrUrl
}
