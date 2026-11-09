import React, { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'

type Category = 'nongkrong' | 'liburan' | 'kuliner' | 'perayaan' | 'random'
const categories: Category[] = ['nongkrong', 'liburan', 'kuliner', 'perayaan', 'random']

export default function InputsAndBadges() {
  const [title, setTitle] = useState('')
  const titleError = title.length > 0 && title.length < 3

  return (
    <section className="flex flex-col gap-8" aria-labelledby="inputs-badges-title">
      <div>
        <h2 id="inputs-badges-title" className="font-heading text-2xl font-bold text-ink">Inputs & Badges</h2>
        <p className="mt-1 text-sm text-ink-soft">Field memakai sunken surface; error selalu punya teks inline, bukan warna saja.</p>
      </div>
      <form className="grid max-w-2xl gap-5" onSubmit={(event) => event.preventDefault()}>
        <div className="ds-field" aria-invalid={titleError}>
          <label className="ds-field__label" htmlFor="library-title">Judul momen</label>
          <Input id="library-title" name="title" className="ds-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Contoh: Senja di pantai" aria-describedby={titleError ? 'library-title-error' : undefined} autoComplete="off" />
          {titleError && <p id="library-title-error" className="ds-field__error" role="alert">Judul minimal 3 karakter.</p>}
        </div>
        <div className="ds-field">
          <label className="ds-field__label" htmlFor="library-note">Catatan</label>
          <Textarea id="library-note" name="note" placeholder="Tulis sedikit tentang momen ini..." />
        </div>
      </form>
      <div className="flex flex-wrap gap-2" aria-label="Category badges">
        {categories.map((category) => <Badge key={category} category={category}>{category[0].toUpperCase() + category.slice(1)}</Badge>)}
        <span className="ds-badge ds-badge--clay">Baru</span>
        <span className="ds-badge ds-badge--sage">Selesai</span>
        <span className="ds-badge ds-badge--honey">Spesial</span>
      </div>
    </section>
  )
}
