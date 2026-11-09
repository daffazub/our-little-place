import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'

function LibraryButton({ label, variant, loading = false, disabled = false }: { label: string; variant: 'clay' | 'sage' | 'outline'; loading?: boolean; disabled?: boolean }) {
  return <Button type="button" variant={variant} disabled={disabled} loading={loading}>{label}</Button>
}

export default function ButtonsAndCards() {
  const [saved, setSaved] = useState(false)

  return (
    <section className="flex flex-col gap-8" aria-labelledby="buttons-cards-title">
      <div>
        <h2 id="buttons-cards-title" className="font-heading text-2xl font-bold text-ink">Buttons & Cards</h2>
        <p className="mt-1 text-sm text-ink-soft">Clay untuk aksi utama, sage untuk status selesai; radius mengikuti fungsi komponen.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3" aria-label="Button states">
        <LibraryButton label="Default" variant="clay" />
        <LibraryButton label="Sage" variant="sage" />
        <LibraryButton label="Secondary" variant="outline" />
        <LibraryButton label="Loading" variant="clay" loading />
        <LibraryButton label="Disabled" variant="clay" disabled />
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <article className="ds-card ds-card--photo p-5">
          <h3 className="font-heading text-lg font-bold text-ink">Photo card</h3>
          <p className="mt-2 text-sm text-ink-soft">Radius-lg memberi karakter seperti cetakan foto.</p>
        </article>
        <article className="ds-card ds-card--content p-5">
          <h3 className="font-heading text-lg font-bold text-ink">Story card</h3>
          <p className="mt-2 text-sm text-ink-soft">Radius-2xl untuk konten cerita yang lebih lembut.</p>
          <footer className="mt-4">
            <button type="button" className="ds-button ds-button--clay" onClick={() => setSaved((value) => !value)}>
              {saved ? 'Tersimpan' : 'Simpan cerita'}
            </button>
          </footer>
        </article>
        <article className="ds-card ds-card--modal p-5">
          <h3 className="font-heading text-lg font-bold text-ink">Modal surface</h3>
          <p className="mt-2 text-sm text-ink-soft">Radius-3xl dan shadow-modal menandai overlay.</p>
        </article>
      </div>
    </section>
  )
}
