'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Filter } from 'lucide-react'

export interface FilterItem {
  id: string
  label: string
  bg?: string
  text?: string
}

export interface CategoryFilterBarProps {
  categories: FilterItem[]
  selectedId: string
  onSelect: (id: string) => void
  label?: string
}

export default function CategoryFilterBar({
  categories,
  selectedId,
  onSelect,
  label = 'Kategori',
}: CategoryFilterBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    // Show fade if there is more content to scroll right (tolerance 4px)
    setCanScrollRight(scrollWidth - (scrollLeft + clientWidth) > 4)
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [categories])

  return (
    <div
      className="relative rounded-2xl p-2.5 sm:p-3 shadow-2xs border select-none transition-all"
      style={{
        background: 'var(--surface)',
        borderColor: 'rgba(232, 232, 230, 0.8)',
      }}
    >
      <div className="flex items-center gap-2">
        {/* Filter prefix icon */}
        <div className="flex items-center gap-1.5 pl-1.5 pr-2 text-xs font-bold text-[var(--text-muted)] shrink-0 hidden sm:flex">
          <Filter className="w-3.5 h-3.5 text-[var(--joy-peach)]" />
          <span>{label}:</span>
        </div>

        {/* Scrollable Chip Container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 scroll-smooth"
          style={{
            scrollSnapType: 'x mandatory',
          }}
        >
          {categories.map((cat) => {
            const isSelected = selectedId === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelect(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 active:scale-95 ${
                  isSelected ? 'shadow-2xs font-bold' : 'hover:bg-black/5 text-[var(--text-secondary)]'
                }`}
                style={{
                  scrollSnapAlign: 'start',
                  background: isSelected
                    ? cat.bg || 'var(--joy-yellow-light)'
                    : 'var(--surface-subtle)',
                  color: isSelected
                    ? cat.text || 'var(--joy-charcoal)'
                    : 'var(--text-secondary)',
                  border: isSelected
                    ? '1.5px solid rgba(255, 217, 125, 0.7)'
                    : '1px solid var(--border)',
                }}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Subtle Right Fade Gradient to indicate more items to scroll */}
      {canScrollRight && (
        <div
          className="pointer-events-none absolute right-1.5 top-1 bottom-1 w-10 rounded-r-xl transition-opacity duration-300"
          style={{
            background: 'linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.95) 100%)',
          }}
        />
      )}
    </div>
  )
}

