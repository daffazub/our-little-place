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
    <div className="audio-dock fixed left-4 right-4 z-40 mx-auto max-w-xl">
      <div
        className="flex items-center gap-3 border-2 border-[var(--color-ink)] bg-[var(--color-surface)] p-3"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-line)',
          boxShadow: 'var(--shadow-float)',
        }}
      >
        {/* Disc Icon */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--color-ink)] ${
            isPlaying ? 'animate-pulse' : ''
          }`}
          style={{
            background: 'var(--color-sunken)',
            borderColor: 'var(--color-line)',
            color: 'var(--color-clay)',
          }}
        >
          <Music className="w-5 h-5 text-[var(--color-clay)]" />
        </div>

        {/* Track Details & Progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold truncate text-[var(--color-ink)]">
              {currentTrack.title}
            </h4>
            <span className="text-[10px] shrink-0 text-[var(--color-ink-soft)]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <p className="text-[11px] truncate text-[var(--color-ink-soft)]">
            {currentTrack.artist || 'Musik Kenangan'}
          </p>

          {/* Progress Slider */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime || 0}
            onChange={(e) => seekTo(Number(e.target.value))}
            className="w-full h-1 mt-1.5 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--color-clay) ${progress}%, var(--color-line) ${progress}%)`,
              accentColor: 'var(--color-clay)',
            }}
          />
        </div>

        {/* Player Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={prev}
            title="Lagu sebelumnya"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--color-sunken)] text-[var(--color-ink-soft)] cursor-pointer"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            title={isPlaying ? 'Jeda' : 'Putar'}
            className="flex h-9 w-9 items-center justify-center border border-[var(--color-clay)] bg-[var(--color-clay)] text-[var(--color-white)] transition-colors active:translate-y-px cursor-pointer"
            style={{
              background: 'var(--color-clay)',
              border: '1px solid var(--color-clay-deep)',
            }}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current text-[var(--color-white)]" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5 text-[var(--color-white)]" />
            )}
          </button>

          <button
            onClick={next}
            title="Lagu berikutnya"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--color-sunken)] text-[var(--color-ink-soft)] cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={toggleMute}
            title={isMuted ? 'Nyalakan suara' : 'Bisukan'}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--color-sunken)] text-[var(--color-ink-soft)] cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[var(--color-ink-soft)]" />}
          </button>
        </div>
      </div>
    </div>
  )
}
