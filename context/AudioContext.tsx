'use client'

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type { MusicTrack } from '@/types/database'
import { getSignedMusicUrl } from '@/lib/storage'

interface AudioContextValue {
  currentTrack: MusicTrack | null
  queue: MusicTrack[]
  isPlaying: boolean
  isMuted: boolean
  currentTime: number
  duration: number
  setQueue: (tracks: MusicTrack[]) => void
  play: (track?: MusicTrack) => void
  pause: () => void
  togglePlay: () => void
  next: () => void
  prev: () => void
  toggleMute: () => void
  seekTo: (seconds: number) => void
}

const AudioCtx = createContext<AudioContextValue | null>(null)

// ─── Provider — audio tag never unmounts across page navigations ──
export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [queue, setQueueState] = useState<MusicTrack[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Create audio element once on mount
  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.onended = () => handleNext()
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime)
    audio.onloadedmetadata = () => setDuration(audio.duration)
    audioRef.current = audio

    return () => {
      audio.pause()
      audio.src = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadTrack = useCallback(async (track: MusicTrack) => {
    const audio = audioRef.current
    if (!audio) return

    try {
      const url = await getSignedMusicUrl(track.storage_path)
      audio.src = url
      audio.load()
      setCurrentTrack(track)
    } catch {
      console.warn('Failed to load track:', track.title)
    }
  }, [])

  const play = useCallback(
    async (track?: MusicTrack) => {
      const audio = audioRef.current
      if (!audio) return

      if (track && track.id !== currentTrack?.id) {
        await loadTrack(track)
      }

      try {
        await audio.play()
        setIsPlaying(true)
      } catch {
        setIsPlaying(false)
      }
    },
    [currentTrack, loadTrack]
  )

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const togglePlay = useCallback(() => {
    if (isPlaying) pause()
    else play()
  }, [isPlaying, play, pause])

  const handleNext = useCallback(() => {
    if (!queue.length) return
    const nextIdx = (currentIdx + 1) % queue.length
    setCurrentIdx(nextIdx)
    play(queue[nextIdx])
  }, [currentIdx, queue, play])

  const handlePrev = useCallback(() => {
    if (!queue.length) return
    const prevIdx = (currentIdx - 1 + queue.length) % queue.length
    setCurrentIdx(prevIdx)
    play(queue[prevIdx])
  }, [currentIdx, queue, play])

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.muted = !isMuted
    setIsMuted(prev => !prev)
  }, [isMuted])

  const seekTo = useCallback((seconds: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = seconds
  }, [])

  const setQueue = useCallback(
    (tracks: MusicTrack[]) => {
      setQueueState(tracks)
      setCurrentIdx(0)
      if (tracks[0]) {
        loadTrack(tracks[0])
      }
    },
    [loadTrack]
  )

  return (
    <AudioCtx.Provider
      value={{
        currentTrack,
        queue,
        isPlaying,
        isMuted,
        currentTime,
        duration,
        setQueue,
        play,
        pause,
        togglePlay,
        next: handleNext,
        prev: handlePrev,
        toggleMute,
        seekTo,
      }}
    >
      {children}
    </AudioCtx.Provider>
  )
}

export function useAudio() {
  const ctx = useContext(AudioCtx)
  if (!ctx) throw new Error('useAudio must be used within AudioProvider')
  return ctx
}

