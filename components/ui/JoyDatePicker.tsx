'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

interface JoyDatePickerProps {
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  label?: string
  className?: string
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export default function JoyDatePicker({
  value,
  onChange,
  label,
  className = '',
}: JoyDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Parse current selected date
  const parsedDate = value ? new Date(value + 'T00:00:00') : new Date()
  const [viewYear, setViewYear] = useState(parsedDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsedDate.getMonth())

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Helpers
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay()

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(y => y - 1)
    } else {
      setViewMonth(m => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(y => y + 1)
    } else {
      setViewMonth(m => m + 1)
    }
  }

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0')
    const formattedDay = String(day).padStart(2, '0')
    const dateString = `${viewYear}-${formattedMonth}-${formattedDay}`
    onChange(dateString)
    setIsOpen(false)
  }

  const setQuickDate = (type: 'today' | 'yesterday' | 'tomorrow') => {
    const now = new Date()
    if (type === 'yesterday') {
      now.setDate(now.getDate() - 1)
    } else if (type === 'tomorrow') {
      now.setDate(now.getDate() + 1)
    }
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    onChange(`${y}-${m}-${d}`)
    setViewYear(y)
    setViewMonth(now.getMonth())
    setIsOpen(false)
  }

  // Format date display for button
  const displayFormatted = (() => {
    if (!value) return 'Pilih Tanggal'
    try {
      const d = new Date(value + 'T00:00:00')
      return d.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return value
    }
  })()

  const todayStr = (() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })()

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide text-[var(--text-secondary)]">
          {label}
        </label>
      )}

      {/* Button trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--joy-peach)] flex items-center justify-between text-xs text-[var(--text-primary)] transition-all shadow-xs group focus:outline-none focus:ring-2 focus:ring-[var(--joy-yellow)]/60 cursor-pointer"
      >
        <span className="flex items-center gap-2 font-medium truncate">
          <span className="w-7 h-7 rounded-xl bg-[var(--joy-yellow-light)] text-[var(--joy-peach)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <CalendarIcon className="w-3.5 h-3.5" />
          </span>
          <span className="font-semibold text-[var(--joy-charcoal)]">{displayFormatted}</span>
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] group-hover:bg-[var(--joy-yellow-light)] transition-colors shrink-0">
          Ubah
        </span>
      </button>

      {/* Popover Calendar */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 z-50 w-76 p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl animate-fade-in-up"
          style={{
            boxShadow: '0 12px 36px -6px rgba(255, 180, 162, 0.25), 0 4px 12px rgba(0,0,0,0.06)'
          }}
        >
          {/* Quick chips (Pills matching CategoryFilterBar style) */}
          <div className="flex items-center gap-1.5 mb-3 pb-2.5 border-b border-[var(--border)] overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setQuickDate('yesterday')}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--joy-yellow-light)] hover:text-[var(--joy-charcoal)] transition-all shrink-0 cursor-pointer"
            >
              Kemarin
            </button>
            <button
              type="button"
              onClick={() => setQuickDate('today')}
              className="px-3 py-1 rounded-full text-[10px] font-bold border border-[rgba(255,217,125,0.7)] bg-[var(--joy-yellow-light)] text-[var(--joy-charcoal)] hover:opacity-90 transition-all shrink-0 flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3 h-3 text-[var(--joy-peach)]" /> Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setQuickDate('tomorrow')}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--joy-yellow-light)] hover:text-[var(--joy-charcoal)] transition-all shrink-0 cursor-pointer"
            >
              Besok
            </button>
          </div>

          {/* Month & Year navigation with soft pastel hover */}
          <div className="flex items-center justify-between mb-3 px-1">
            <h4 className="text-xs font-bold text-[var(--joy-charcoal)]" style={{ fontFamily: 'var(--font-heading)' }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h4>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Bulan sebelumnya"
                className="w-7 h-7 rounded-xl flex items-center justify-center text-[var(--joy-charcoal)] hover:bg-[var(--joy-yellow-light)] hover:text-[var(--joy-peach)] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Bulan berikutnya"
                className="w-7 h-7 rounded-xl flex items-center justify-center text-[var(--joy-charcoal)] hover:bg-[var(--joy-yellow-light)] hover:text-[var(--joy-peach)] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {DAY_NAMES.map((name, i) => (
              <span
                key={name}
                className={`text-[10px] font-bold ${
                  i === 0 ? 'text-[var(--joy-error)]' : 'text-[var(--text-muted)]'
                }`}
              >
                {name}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="w-8 h-8" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayFormatted = String(day).padStart(2, '0')
              const monthFormatted = String(viewMonth + 1).padStart(2, '0')
              const currentSlotDate = `${viewYear}-${monthFormatted}-${dayFormatted}`
              const isSelected = currentSlotDate === value
              const isToday = currentSlotDate === todayStr

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`w-8 h-8 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'shadow-xs font-bold scale-105'
                      : 'hover:bg-[var(--joy-yellow-light)] text-[var(--joy-charcoal)]'
                  } ${isToday && !isSelected ? 'border border-[var(--joy-peach)] font-bold text-[var(--joy-peach)]' : ''}`}
                  style={
                    isSelected
                      ? {
                          background: 'linear-gradient(135deg, var(--joy-accent-peach) 0%, var(--joy-accent-yellow) 100%)',
                          color: 'var(--joy-charcoal)',
                          boxShadow: '0 2px 8px rgba(255, 180, 162, 0.45)',
                        }
                      : {}
                  }
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

