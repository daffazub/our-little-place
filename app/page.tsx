'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Plus, Key, ShieldCheck, Users } from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import { ButtonLink } from '@/components/ui/Button'

export default function RootLandingPage() {
  const { session, isLoading } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && session?.room_id) router.replace(`/room/${session.room_id}`)
  }, [isLoading, session, router])

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--color-paper)]">
        <div className="w-full max-w-xs space-y-3">
          <div className="h-1 w-16 bg-[var(--color-clay)]" />
          <div className="h-5 w-48 skeleton" />
          <div className="h-3 w-32 skeleton" />
        </div>
      </div>
    )
  }

  if (session?.room_id) return null

  return (
    <main className="min-h-dvh bg-[var(--color-paper)] text-[var(--color-ink)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-5 sm:px-8 sm:py-8">
        <header className="flex items-center justify-between border-b-2 border-[var(--color-ink)] pb-4">
          <Link href="/" aria-label="Our Little Place beranda" className="font-display text-sm font-semibold tracking-tight">
            Our Little Place
          </Link>
          <span className="font-mono text-[11px] text-[var(--color-ink-soft)]">Ruang privat bersama</span>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          <div className="max-w-2xl">
            <p className="mb-6 max-w-xl font-body text-lg leading-relaxed text-[var(--color-ink-soft)]">
              Foto, cerita, dan rencana yang hanya perlu dibaca oleh lingkaran kecilmu.
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-[var(--color-ink)] sm:text-7xl">
              Tempat untuk hal-hal yang ingin kamu simpan.
            </h1>
            <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="/create" className="min-h-12 px-6 text-sm">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Buat ruang baru
              </ButtonLink>
              <Link href="/create" className="inline-flex min-h-12 items-center gap-2 border-b border-[var(--color-clay)] px-1 font-display text-sm font-medium text-[var(--color-ink)] transition-colors hover:text-[var(--color-clay)]">
                <Key className="h-4 w-4" aria-hidden="true" />
                Masuk dengan undangan
              </Link>
            </div>
          </div>

          <div className="border-t-2 border-[var(--color-ink)] pt-5 lg:mt-24">
            <p className="mb-8 max-w-sm font-body text-lg leading-relaxed text-[var(--color-ink-soft)]">
              Satu room, tanpa feed publik, tanpa distraksi. Hanya arsip kecil yang tumbuh bersama.
            </p>
            <dl className="divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
              <div className="flex items-start gap-5 py-5">
                <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[var(--color-clay)]" aria-hidden="true" />
                <div><dt className="font-display text-sm font-semibold">Privat dari awal</dt><dd className="mt-1 font-body text-sm text-[var(--color-ink-soft)]">Akses melalui undangan aktif.</dd></div>
              </div>
              <div className="flex items-start gap-5 py-5">
                <Users className="mt-1 h-5 w-5 shrink-0 text-[var(--color-clay)]" aria-hidden="true" />
                <div><dt className="font-display text-sm font-semibold">Dibuat untuk sedikit orang</dt><dd className="mt-1 font-body text-sm text-[var(--color-ink-soft)]">Pasangan, sahabat dekat, atau keluarga.</dd></div>
              </div>
              <div className="flex items-start gap-5 py-5">
                <Heart className="mt-1 h-5 w-5 shrink-0 text-[var(--color-clay)]" aria-hidden="true" />
                <div><dt className="font-display text-sm font-semibold">Berisi hal yang berarti</dt><dd className="mt-1 font-body text-sm text-[var(--color-ink-soft)]">Kenangan, cerita, agenda, dan tanggal penting.</dd></div>
              </div>
            </dl>
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-[var(--color-line)] pt-4 font-body text-xs text-[var(--color-ink-soft)] sm:flex-row sm:items-center sm:justify-between">
          <span>Our Little Place</span>
          <span>Ruang kenangan untuk lingkaran kecil.</span>
        </footer>
      </div>
    </main>
  )
}
