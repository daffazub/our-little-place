'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Filter } from 'lucide-react'

export interface FilterItem {
  id: string
  label: string
  dotColor?: string
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
    setCanScrollRight(scrollWidth - (scrollLeft + clientWidth) > 4)
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [categories])

  return (
    <div
      className="relative rounded-2xl p-2.5 sm:p-3 border select-none transition-colors"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-line)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex items-center gap-2">
        {/* Filter prefix icon */}
        <div className="flex items-center gap-1.5 pl-1.5 pr-2 text-xs font-semibold text-[var(--color-ink-soft)] shrink-0 hidden sm:flex">
          <Filter className="w-3.5 h-3.5 text-[var(--color-clay)]" />
          <span>{label}:</span>
        </div>

        {/* Scrollable Chip Container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 scroll-smooth"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {categories.map((cat) => {
            const isSelected = selectedId === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelect(cat.id)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors duration-200 cursor-pointer shrink-0 active:scale-95 flex items-center gap-1.5"
                style={{
                  scrollSnapAlign: 'start',
                  background: isSelected ? 'var(--color-clay)' : 'var(--color-sunken)',
                  color: isSelected ? 'var(--color-white)' : 'var(--color-ink-soft)',
                  border: isSelected ? '1px solid var(--color-clay-deep)' : '1px solid var(--color-line)',
                  boxShadow: isSelected ? 'var(--shadow-card)' : 'none',
                }}
              >
                {cat.dotColor && !isSelected && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: cat.dotColor }}
                  />
                )}
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Subtle Right Fade Gradient */}
      {canScrollRight && (
        <div
          className="pointer-events-none absolute right-1.5 top-1 bottom-1 w-10 rounded-r-xl transition-opacity duration-300"
          style={{
            background: 'linear-gradient(to right, transparent 0%, var(--color-surface) 100%)',
          }}
        />
      )}
    </div>
  )
}
