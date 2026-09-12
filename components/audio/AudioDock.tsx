'use client'

import React from 'react'
import { Music, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from 'lucide-react'
import { useAudio } from '@/context/AudioContext'

export default function AudioDock() {
  const {
    currentTrack,
    isPlaying,
    isMuted,
    currentTime,
    duration,
    togglePlay,
    next,
    prev,
    toggleMute,
    seekTo,
  } = useAudio()

  if (!currentTrack) {
    return null
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className="fixed bottom-16 lg:bottom-4 left-4 right-4 max-w-lg mx-auto z-40">
      <div className="bg-[var(--surface)]/95 backdrop-blur-md border border-[var(--border)] rounded-2xl p-3 shadow-xl flex items-center gap-3">
        {/* Disc Icon */}
        <div
          className={`w-10 h-10 rounded-xl bg-[var(--accent-tint)] text-[var(--accent-text)] flex items-center justify-center shrink-0 ${
            isPlaying ? 'animate-pulse' : ''
          }`}
        >
          <Music className="w-5 h-5" />
        </div>

        {/* Track Details & Progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">
              {currentTrack.title}
            </h4>
            <span className="text-[10px] text-[var(--text-muted)] shrink-0">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <p className="text-[11px] text-[var(--text-secondary)] truncate">
            {currentTrack.artist || 'Musik Kenangan'}
          </p>

          {/* Progress Slider */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime || 0}
            onChange={(e) => seekTo(Number(e.target.value))}
            className="w-full h-1 mt-1 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
          />
        </div>

        {/* Player Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={prev}
            title="Lagu sebelumnya"
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            title={isPlaying ? 'Jeda' : 'Putar'}
            className="w-8 h-8 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] flex items-center justify-center hover:bg-[var(--accent-hover)] transition-all active:scale-95 shadow-sm"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={next}
            title="Lagu berikutnya"
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={toggleMute}
            title={isMuted ? 'Nyalakan suara' : 'Bisukan'}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}

