'use client'

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react'

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
    }, 3200)
  }, [removeToast])

  const success = useCallback((message: string) => showToast(message, 'success'), [showToast])
  const warning = useCallback((message: string) => showToast(message, 'warning'), [showToast])
  const error = useCallback((message: string) => showToast(message, 'error'), [showToast])
  const info = useCallback((message: string) => showToast(message, 'info'), [showToast])

  return (
    <ToastContext.Provider value={{ showToast, success, warning, error, info }}>
      {children}

      {/* Floating Toast Container above Ambient Audio Dock */}
      <div
        className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none w-full max-w-sm px-4"
        aria-live="polite"
      >
        {toasts.map(toast => {
          let icon = <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2d6a4a]" />
          let iconBg = 'var(--joy-accent-green)'
          let borderColor = 'rgba(205, 231, 208, 0.9)'

          if (toast.variant === 'warning') {
            icon = <AlertTriangle className="w-4 h-4 shrink-0 text-[#854d0e]" />
            iconBg = 'var(--joy-accent-yellow)'
            borderColor = 'rgba(255, 217, 125, 0.9)'
          } else if (toast.variant === 'error') {
            icon = <AlertCircle className="w-4 h-4 shrink-0 text-[#e05252]" />
            iconBg = 'rgba(224, 82, 82, 0.12)'
            borderColor = 'rgba(224, 82, 82, 0.4)'
          }

          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-300 w-full"
              style={{
                background: 'rgba(255, 255, 255, 0.96)',
                borderColor,
                boxShadow: '0 8px 30px -4px rgba(0, 0, 0, 0.12)',
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                  style={{ background: iconBg }}
                >
                  {icon}
                </div>
                <p className="text-xs font-semibold leading-snug text-[var(--joy-charcoal)] truncate-2-lines">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--joy-charcoal)] hover:bg-black/5 transition-colors cursor-pointer shrink-0"
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
