'use client'

import imageCompression from 'browser-image-compression'
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import { storage } from './firebase/client'

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,          // 500 KB max
  maxWidthOrHeight: 1200,
  useWebWorker: true,
  fileType: 'image/webp',  // Convert to WebP
  initialQuality: 0.82,
}

export interface UploadResult {
  storagePath: string
  downloadUrl: string
}

// ─── Photo upload with auto-compression ───────────────────────
export async function uploadPhoto(
  file: File,
  roomId: string,
  memoryId: string
): Promise<UploadResult> {
  let fileToUpload = file

  if (file.type.startsWith('image/')) {
    try {
      fileToUpload = await imageCompression(file, COMPRESSION_OPTIONS)
    } catch {
      fileToUpload = file
    }
  }

  const ext = fileToUpload.type === 'image/webp' ? 'webp' : file.name.split('.').pop() ?? 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const storagePath = `rooms/${roomId}/memories/${memoryId}/${fileName}`
  const storageRef = ref(storage, storagePath)

  await uploadBytes(storageRef, fileToUpload, {
    contentType: fileToUpload.type || 'image/jpeg',
  })

  const downloadUrl = await getDownloadURL(storageRef)
  return { storagePath, downloadUrl }
}

// ─── Video upload (no compression) ───────────────────────────
export async function uploadVideo(
  file: File,
  roomId: string,
  memoryId: string
): Promise<UploadResult> {
  const ext = file.name.split('.').pop() ?? 'mp4'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const storagePath = `rooms/${roomId}/videos/${memoryId}/${fileName}`
  const storageRef = ref(storage, storagePath)

  await uploadBytes(storageRef, file, {
    contentType: file.type || 'video/mp4',
  })

  const downloadUrl = await getDownloadURL(storageRef)
  return { storagePath, downloadUrl }
}

// ─── Music upload ─────────────────────────────────────────────
export async function uploadMusic(
  file: File,
  roomId: string
): Promise<UploadResult> {
  const ext = file.name.split('.').pop() ?? 'mp3'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const storagePath = `rooms/${roomId}/music/${fileName}`
  const storageRef = ref(storage, storagePath)

  await uploadBytes(storageRef, file, {
    contentType: file.type || 'audio/mpeg',
  })

  const downloadUrl = await getDownloadURL(storageRef)
  return { storagePath, downloadUrl }
}

// ─── Get music download URL ──────────────────────────────────
export async function getSignedMusicUrl(storagePath: string): Promise<string> {
  if (!storagePath) return ''
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath
  }
  const storageRef = ref(storage, storagePath)
  return getDownloadURL(storageRef)
}

// ─── Delete file from storage ─────────────────────────────────
export async function deleteStorageFile(storagePathOrUrl: string): Promise<void> {
  try {
    let storageRef
    if (storagePathOrUrl.startsWith('http://') || storagePathOrUrl.startsWith('https://')) {
      storageRef = ref(storage, storagePathOrUrl)
    } else {
      storageRef = ref(storage, storagePathOrUrl)
    }
    await deleteObject(storageRef)
  } catch (err) {
    console.error('Failed to delete storage file:', err)
  }
}

// ─── Helper to detect if file is video ────────────────────────
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/')
}

// ─── Get display URL (handles both URLs and storage paths) ─────
export function getMediaUrl(storagePathOrUrl?: string | null): string {
  if (!storagePathOrUrl) return ''
  if (storagePathOrUrl.startsWith('http://') || storagePathOrUrl.startsWith('https://')) {
    return storagePathOrUrl
  }
  // If it's a relative path, Firebase Storage URL format fallback
  return storagePathOrUrl
}
