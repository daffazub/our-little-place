'use client'

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { CheckCircle2, AlertTriangle, AlertCircle, X, Info } from 'lucide-react'

export type ToastVariant = 'success' | 'warning' | 'error' | 'info'

export interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void
  success: (message: string) => void
  warning: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev.slice(-2), { id, message, variant }]) // keep max 3 visible

    setTimeout(() => {
      removeToast(id)
    }, 3500)
  }, [removeToast])

  const success = useCallback((message: string) => showToast(message, 'success'), [showToast])
  const warning = useCallback((message: string) => showToast(message, 'warning'), [showToast])
  const error = useCallback((message: string) => showToast(message, 'error'), [showToast])
  const info = useCallback((message: string) => showToast(message, 'info'), [showToast])

  return (
    <ToastContext.Provider value={{ showToast, success, warning, error, info }}>
      {children}

      {/* Floating Toast Container */}
      <div
        className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none w-full max-w-sm px-4"
        aria-live="polite"
      >
        {toasts.map(toast => {
          let icon = <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--color-sage-deep)]" />
          let iconBg = 'var(--color-sage-tint)'

          if (toast.variant === 'warning') {
            icon = <AlertTriangle className="w-4 h-4 shrink-0 text-[var(--color-warning-text)]" />
            iconBg = 'var(--color-honey)'
          } else if (toast.variant === 'error') {
            icon = <AlertCircle className="w-4 h-4 shrink-0 text-[var(--color-error)]" />
            iconBg = 'var(--color-danger-tint)'
          } else if (toast.variant === 'info') {
            icon = <Info className="w-4 h-4 shrink-0 text-[var(--color-clay)]" />
            iconBg = 'var(--color-clay-tint)'
          }

          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border transition-all animate-in fade-in slide-in-from-bottom-2 duration-300 w-full"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-line)',
                boxShadow: 'var(--shadow-float)',
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: iconBg }}
                >
                  {icon}
                </div>
                <p className="text-xs font-semibold leading-snug text-[var(--color-ink)] truncate-2-lines">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-sunken)] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}
