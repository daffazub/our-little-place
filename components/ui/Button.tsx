import React from 'react'
import Link from 'next/link'

export type ButtonVariant = 'clay' | 'sage' | 'outline'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
}

export function Button({ variant = 'clay', loading = false, disabled, children, className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`ds-button ds-button--${variant} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ds-button__spinner" aria-hidden="true" />}
      <span>{loading ? 'Memuat...' : children}</span>
    </button>
  )
}

export function ButtonLink({
  href,
  variant = 'clay',
  children,
  className = '',
  ...props
}: {
  href: string
  variant?: ButtonVariant
  children: React.ReactNode
  className?: string
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className'>) {
  return <Link href={href} className={`ds-button ds-button--${variant} ${className}`} {...props}>{children}</Link>
}
