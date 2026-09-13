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
      <div
        className="backdrop-blur-md rounded-2xl p-3 shadow-xl flex items-center gap-3"
        style={{
          background: 'rgba(255,255,255,0.88)',
          border: '1px solid rgba(232,232,230,0.9)',
          boxShadow: '0 8px 32px rgba(168,213,186,0.2), 0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        {/* Disc Icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isPlaying ? 'animate-pulse' : ''
          }`}
          style={{ background: 'var(--gradient-story)' }}
        >
          <Music className="w-5 h-5" style={{ color: 'var(--joy-charcoal)' }} />
        </div>

        {/* Track Details & Progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {currentTrack.title}
            </h4>
            <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <p className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
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
              background: `linear-gradient(to right, var(--joy-green) ${progress}%, var(--border) ${progress}%)`,
              accentColor: 'var(--joy-green)',
            }}
          />
        </div>

        {/* Player Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={prev}
            title="Lagu sebelumnya"
            className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
            style={{ color: 'var(--text-secondary)' }}
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            title={isPlaying ? 'Jeda' : 'Putar'}
            className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all active:scale-95 hover:opacity-90"
            style={{ background: 'var(--gradient-memory)', color: 'var(--joy-charcoal)' }}
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
            className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
            style={{ color: 'var(--text-secondary)' }}
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={toggleMute}
            title={isMuted ? 'Nyalakan suara' : 'Bisukan'}
            className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
            style={{ color: 'var(--text-muted)' }}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
