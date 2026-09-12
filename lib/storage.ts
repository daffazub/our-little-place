'use client'

import imageCompression from 'browser-image-compression'
import { supabase } from './supabase/client'

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,          // 500 KB max
  maxWidthOrHeight: 1200,
  useWebWorker: true,
  fileType: 'image/webp',  // Convert to WebP for better compression
  initialQuality: 0.82,
}

// ─── Photo upload with auto-compression ───────────────────────
export async function uploadPhoto(
  file: File,
  roomId: string,
  memoryId: string
): Promise<string> {
  let fileToUpload = file

  if (file.type.startsWith('image/')) {
    try {
      fileToUpload = await imageCompression(file, COMPRESSION_OPTIONS)
    } catch {
      // Fall back to original if compression fails
      fileToUpload = file
    }
  }

  const ext = fileToUpload.type === 'image/webp' ? 'webp' : file.name.split('.').pop() ?? 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const storagePath = `${roomId}/${memoryId}/${fileName}`

  const { error } = await supabase.storage
    .from('photos')
    .upload(storagePath, fileToUpload, {
      contentType: fileToUpload.type,
      upsert: false,
    })

  if (error) throw new Error(`Upload foto gagal: ${error.message}`)
  return storagePath
}

// ─── Video upload (no compression) ───────────────────────────
export async function uploadVideo(
  file: File,
  roomId: string,
  memoryId: string
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'mp4'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const storagePath = `${roomId}/${memoryId}/${fileName}`

  const { error } = await supabase.storage
    .from('videos')
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (error) throw new Error(`Upload video gagal: ${error.message}`)
  return storagePath
}

// ─── Music upload ─────────────────────────────────────────────
export async function uploadMusic(
  file: File,
  roomId: string
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'mp3'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const storagePath = `${roomId}/${fileName}`

  const { error } = await supabase.storage
    .from('music')
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (error) throw new Error(`Upload musik gagal: ${error.message}`)
  return storagePath
}

// ─── Get public URL ───────────────────────────────────────────
export function getPublicUrl(
  bucket: 'photos' | 'videos',
  storagePath: string
): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath)
  return data.publicUrl
}

// ─── Get signed URL for private bucket (music) ────────────────
export async function getSignedMusicUrl(
  storagePath: string,
  expiresIn = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('music')
    .createSignedUrl(storagePath, expiresIn)

  if (error || !data) throw new Error('Gagal membuat signed URL musik')
  return data.signedUrl
}

// ─── Delete file from storage ─────────────────────────────────
export async function deleteStorageFile(
  bucket: 'photos' | 'videos' | 'music',
  storagePath: string
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([storagePath])
  if (error) throw new Error(`Gagal menghapus file: ${error.message}`)
}

// ─── Detect if file is video by MIME type ─────────────────────
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/')
}

// ─── Get display URL (handles both photos and videos) ─────────
export function getMediaUrl(storagePath: string, bucket: 'photos' | 'videos' = 'photos'): string {
  return getPublicUrl(bucket, storagePath)
}

