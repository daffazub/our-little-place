import React from 'react'

type Category = 'nongkrong' | 'liburan' | 'kuliner' | 'perayaan' | 'random'

export function Badge({ category, className = '', children }: { category?: Category; className?: string; children: React.ReactNode }) {
  return <span className={`ds-badge ${category ? `ds-badge--category ds-badge--${category}` : 'ds-badge--clay'} ${className}`}>{children}</span>
}
