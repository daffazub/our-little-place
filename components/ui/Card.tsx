import React from 'react'

export function Card({ className = '', children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <article {...props} className={`ds-card ds-card--content ${className}`}>{children}</article>
}
