# Our Little Place

Ruang digital privat untuk menyimpan kenangan bersama orang-orang tersayang—foto, cerita, rencana, tanggal penting, dan musik ambient dalam satu room yang hangat.

## Fitur utama

- Create dan join room dengan invite link.
- Firebase Anonymous Authentication tanpa signup email/password.
- Memories dengan foto, kategori, like, dan kompresi client-side.
- Stories/jurnal bersama.
- Plans dengan status upcoming atau completed.
- Kalender tanggal penting dan recurring dates.
- Member settings, invite management, dan persistent audio dock.
- UI mobile-first dengan design system **Kertas Hangat & Tanah Liat**.

## Tech stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Firebase Auth/Firestore/Storage · Vercel

## Quick start

1. Install Node.js dan npm.
2. Jalankan `npm install`.
3. Salin `.env.example` menjadi `.env.local` dan isi enam konfigurasi Firebase.
4. Aktifkan Firebase Anonymous Authentication.
5. Jalankan `npm run dev`, lalu buka `http://localhost:3000`.

## Struktur singkat

```text
app/          Next.js routes dan halaman fitur
components/   UI primitives, feature components, navigasi, audio, dan dev showcase
context/      Session, audio, dan toast state
lib/          Firebase client, services, dan utilities
types/        Tipe domain dan dokumen Firestore (`types/index.ts`)
public/       Asset publik dan manifest
docs/         Dokumentasi produk, desain, arsitektur, setup, changelog
tests/        Test yang tersedia
```

## Dokumentasi

- [PRD](docs/PRD.md) — tujuan, alur, batasan, dan roadmap.
- [DESIGN](docs/DESIGN.md) — token, tipografi, komponen, dan aksesibilitas.
- [ARCHITECTURE](docs/ARCHITECTURE.md) — struktur, alur data, skema, dan rules.
- [SETUP](docs/SETUP.md) — instalasi, Firebase, rules, dan Vercel.
- [CHANGELOG](docs/CHANGELOG.md) — perubahan per milestone.
