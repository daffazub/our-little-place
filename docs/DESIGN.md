# Design System — Almanac

Redesign Hallmark untuk **Our Little Place** memakai register Almanac: slate paper, blue-black ink, rule-led surfaces, editorial serif untuk isi, dan satu sinyal magenta yang hemat. Sistem ini sengaja meninggalkan pola lama cream, rounded-card, dan terracotta agar aplikasi terasa seperti arsip bersama yang dibuat dengan sadar, bukan dashboard generik.

## Material dan arah

- **Paper:** slate kebiruan sebagai kanvas utama.
- **Ink:** blue-black untuk struktur dan teks utama.
- **Sheet:** surface terang untuk area kerja yang sedang dibaca.
- **Signal:** magenta hanya untuk primary action, focus, dan state aktif.
- **Depth:** aturan, perubahan paper, dan ukuran type; bukan shadow besar atau glass.
- **Shape:** sudut hampir kotak; radius hanya 2px untuk kontrol kecil.

## Token inti

Token runtime berada di `app/globals.css` dalam blok `:root` dan `@theme`.

| Token | Peran |
|---|---|
| `--color-paper` | Canvas slate halaman |
| `--color-paper-2` / `--color-paper-3` | Alternate paper dan well |
| `--color-surface` | Printed sheet dan area kerja |
| `--color-sunken` | Recessed form surface |
| `--color-ink` / `--color-ink-soft` | Teks utama dan sekunder |
| `--color-line` / `--color-border-strong` | Hairline dan firm rule |
| `--color-clay` / `--color-clay-deep` | Satu primary signal magenta |
| `--color-clay-contrast` | Teks di atas signal |
| `--color-error` / `--color-danger-tint` | Error dan destructive state |
| `--color-sage` / `--color-honey` | Status dan tanggal penting, bukan dekorasi |

Nama `--color-clay` dipertahankan sebagai compatibility alias untuk komponen yang sudah ada; nilai visualnya sekarang adalah magenta Almanac. Token `--joy-*` tidak digunakan.

## Tipografi

- **Hanken Grotesk:** heading, navigasi, label, button, dan struktur aplikasi.
- **Newsreader:** body copy, deskripsi, cerita, dan teks yang dibaca panjang.
- **IBM Plex Mono:** angka yang dibandingkan, waktu, dan metadata teknis.
- Heading memakai satu weight dan satu warna; tidak ada satu kata berwarna atau italic sebagai dekorasi.
- Label memakai sentence case dan tidak memakai tracking kapital.

## Surface ladder

1. Canvas tanpa border.
2. Hairline `--color-line` untuk pembagian.
3. Well `--color-paper-2` untuk area pendukung.
4. Sheet `--color-surface` dengan firm rule di atas untuk konten utama.

Tidak ada card-in-card, shadow besar, gradient dekoratif, atau glass surface.

## Komponen dan interaksi

- Primary button memakai signal magenta; secondary memakai outline ink.
- Input memiliki border konstan dan focus ring `--color-clay`.
- Mobile navigation memakai rule dan active underline, bukan pill bertingkat.
- Audio dock adalah utility strip yang tenang dan tidak mengambil alih layar.
- Category color dipakai sebagai penanda kecil, bukan blok latar.
- Dialog dan destructive action tetap memakai semantics native serta konfirmasi yang sudah ada.

## Motion dan accessibility

- Motion hanya untuk state, transform, dan opacity.
- Tidak memakai `transition: all`, layout animation, count-up dekoratif, atau auto-rotating content tanpa kontrol.
- Semua interactive element memiliki `:focus-visible`.
- Semua animation memiliki `prefers-reduced-motion` fallback.
- `html` dan `body` memakai `overflow-x: clip`.
- Body text minimal 16px pada area baca; error tidak disampaikan hanya dengan warna.
- Touch target mobile ditargetkan minimal 44px.

## Hallmark scope

Redesign ini memakai scope `app`: route, shell, forms, table/list states, dan feature screens diperlakukan sebagai aplikasi yang dipakai, bukan landing page marketing. Firebase wiring, route, field, handler, link, ID, dan test hook dipertahankan.
