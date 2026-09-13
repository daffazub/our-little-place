'use client'

import React from 'react'
import { Sparkles, LucideIcon } from 'lucide-react'

export interface PageHeaderCardProps {
  badge?: {
    text: string
    icon?: LucideIcon
    bg?: string
    textColor?: string
    borderColor?: string
  }
  title: string
  titleIcon?: LucideIcon
  description: string
  cta?: {
    label: string
    icon?: LucideIcon
    onClick: () => void
    gradient?: string
    textColor?: string
    shadowColor?: string
    disabled?: boolean
  }
  children?: React.ReactNode
}

export default function PageHeaderCard({
  badge,
  title,
  titleIcon: TitleIcon,
  description,
  cta,
  children,
}: PageHeaderCardProps) {
  const BadgeIcon = badge?.icon || Sparkles

  return (
    <section
      className="rounded-3xl p-6 sm:p-7 shadow-xs border transition-all select-none"
      style={{
        background: 'var(--surface)',
        borderColor: 'rgba(232, 232, 230, 0.85)',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
        {/* Left Column: Badge, Title, Description with 12-16px vertical spacing */}
        <div className="space-y-3 sm:space-y-3.5 max-w-2xl">
          {/* Badge */}
          {badge && (
            <div>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold shadow-2xs border"
                style={{
                  background: badge.bg || 'var(--joy-yellow-light)',
                  color: badge.textColor || 'var(--joy-charcoal)',
                  borderColor: badge.borderColor || 'rgba(255, 217, 125, 0.45)',
                }}
              >
                <BadgeIcon className="w-3 h-3 text-[var(--joy-peach)] shrink-0" />
                <span>{badge.text}</span>
              </span>
            </div>
          )}

          {/* Title */}
          <h1
            className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5 leading-snug tracking-tight"
            style={{ color: 'var(--joy-charcoal)', fontFamily: 'var(--font-heading)' }}
          >
            {TitleIcon && <TitleIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--joy-peach)] shrink-0" />}
            <span>{title}</span>
          </h1>

          {/* Description */}
          <p className="text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)]">
            {description}
          </p>
        </div>

        {/* Right Column: CTA Button */}
        {cta && (
          <div className="shrink-0 pt-1 md:pt-0">
            <button
              type="button"
              onClick={cta.onClick}
              disabled={cta.disabled}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 shadow-sm hover:opacity-95 hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: cta.gradient || 'var(--gradient-memory)',
                color: cta.textColor || 'var(--joy-charcoal)',
                boxShadow: cta.shadowColor || '0 6px 20px rgba(255, 180, 162, 0.35)',
              }}
            >
              {cta.icon && <cta.icon className="w-4 h-4 shrink-0" />}
              <span>{cta.label}</span>
            </button>
          </div>
        )}
      </div>

      {/* Optional Child Area (e.g. summary counters or mini-widgets) */}
      {children && <div className="mt-4 pt-4 border-t border-[var(--border)]">{children}</div>}
    </section>
  )
}

