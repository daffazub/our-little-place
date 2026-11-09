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
      className="rounded-2xl p-6 sm:p-7 border select-none"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-line)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
        {/* Left Column: Badge, Title, Description */}
        <div className="space-y-3 sm:space-y-3.5 max-w-2xl">
          {badge && (
            <div>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border"
                style={{
                  background: badge.bg || 'var(--color-sunken)',
                  color: badge.textColor || 'var(--color-ink-soft)',
                  borderColor: badge.borderColor || 'var(--color-line)',
                }}
              >
                <BadgeIcon className="w-3.5 h-3.5 text-[var(--color-clay)] shrink-0" />
                <span>{badge.text}</span>
              </span>
            </div>
          )}

          {/* Title */}
          <h1
            className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5 leading-snug tracking-tight text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {TitleIcon && <TitleIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--color-clay)] shrink-0" />}
            <span>{title}</span>
          </h1>

          {/* Description */}
          <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-ink-soft)] font-normal">
            {description}
          </p>
        </div>

        {/* Right Column: CTA Button (Clay Terakota Tunggal) */}
        {cta && (
          <div className="shrink-0 pt-1 md:pt-0">
            <button
              type="button"
              onClick={cta.onClick}
              disabled={cta.disabled}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-bold text-[var(--color-white)] transition-colors duration-200 hover:opacity-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--color-clay)',
                border: '1px solid var(--color-clay-deep)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              {cta.icon && <cta.icon className="w-4 h-4 shrink-0 text-[var(--color-white)]" />}
              <span>{cta.label}</span>
            </button>
          </div>
        )}
      </div>

      {children && <div className="mt-4 pt-4 border-t border-[var(--color-line)]">{children}</div>}
    </section>
  )
}

