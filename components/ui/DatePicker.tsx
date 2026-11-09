'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { getLocalDateString, parseLocalDate, formatLocalDate } from '@/lib/utils/date'

interface DatePickerProps {
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

export default function DatePicker({
  value,
  onChange,
  label,
  className = '',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Parse current selected date
  const parsed = parseLocalDate(value || getLocalDateString())
  const [viewYear, setViewYear] = useState(parsed.year)
  const [viewMonth, setViewMonth] = useState(parsed.month - 1)

  // Sync view when value prop changes
  useEffect(() => {
    if (value) {
      const p = parseLocalDate(value)
      setViewYear(p.year)
      setViewMonth(p.month - 1)
    }
  }, [value])

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
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
    const dateStr = getLocalDateString(now)
    onChange(dateStr)
    const p = parseLocalDate(dateStr)
    setViewYear(p.year)
    setViewMonth(p.month - 1)
    setIsOpen(false)
  }

  // Format date display for button
  const displayFormatted = value
    ? formatLocalDate(value, { showDayName: true, showYear: true, shortMonth: true })
    : 'Pilih Tanggal'

  const todayStr = getLocalDateString()

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-semibold mb-1.5 text-[var(--color-ink-soft)]">
          {label}
        </label>
      )}

      {/* Button trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors group focus:outline-none focus:ring-2 focus:ring-[var(--color-clay)] cursor-pointer"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-line)',
          boxShadow: 'var(--shadow-card)',
          color: 'var(--color-ink)',
        }}
      >
        <span className="flex items-center gap-2 font-medium truncate">
          <span className="w-7 h-7 rounded-lg bg-[var(--color-sunken)] text-[var(--color-clay)] flex items-center justify-center shrink-0">
            <CalendarIcon className="w-3.5 h-3.5" />
          </span>
          <span className="font-semibold text-[var(--color-ink)]">{displayFormatted}</span>
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-sunken)] text-[var(--color-ink-soft)] border border-[var(--color-line)] group-hover:bg-[var(--color-clay-tint)] transition-colors shrink-0">
          Ubah
        </span>
      </button>

      {/* Popover Calendar */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 z-50 w-76 p-4 rounded-2xl border animate-in fade-in"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-line)',
            boxShadow: 'var(--shadow-float)',
          }}
        >
          {/* Quick chips */}
          <div className="flex items-center gap-1.5 mb-3 pb-2.5 border-b border-[var(--color-line)] overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setQuickDate('yesterday')}
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold border border-[var(--color-line)] bg-[var(--color-sunken)] text-[var(--color-ink-soft)] hover:bg-[var(--color-line)] transition-colors shrink-0 cursor-pointer"
            >
              Kemarin
            </button>
            <button
              type="button"
              onClick={() => setQuickDate('today')}
              className="px-3 py-1 rounded-full text-[10px] font-bold border border-[var(--color-clay)] bg-[var(--color-clay-tint)] text-[var(--color-clay-contrast)] hover:opacity-90 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[var(--color-clay)]" /> Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setQuickDate('tomorrow')}
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold border border-[var(--color-line)] bg-[var(--color-sunken)] text-[var(--color-ink-soft)] hover:bg-[var(--color-line)] transition-colors shrink-0 cursor-pointer"
            >
              Besok
            </button>
          </div>

          {/* Month & Year navigation */}
          <div className="flex items-center justify-between mb-3 px-1">
            <h4 className="text-xs font-bold text-[var(--color-ink)]" style={{ fontFamily: 'var(--font-heading)' }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h4>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Bulan sebelumnya"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-ink-soft)] hover:bg-[var(--color-sunken)] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Bulan berikutnya"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-ink-soft)] hover:bg-[var(--color-sunken)] transition-colors cursor-pointer"
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
                  i === 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-ink-soft)]'
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
                  className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                    isSelected
                      ? 'font-bold scale-105'
                      : 'hover:bg-[var(--color-sunken)] text-[var(--color-ink)]'
                  } ${isToday && !isSelected ? 'border border-[var(--color-clay)] font-bold text-[var(--color-clay)]' : ''}`}
                  style={
                    isSelected
                      ? {
                          background: 'var(--color-clay)',
                          color: 'var(--color-white)',
                          boxShadow: 'var(--shadow-card)',
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


