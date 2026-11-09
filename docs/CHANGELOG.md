# Changelog

Semua perubahan penting pada proyek ini dicatat dalam format [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versi mengikuti milestone produk; package version dapat memiliki siklus tersendiri.

## [Unreleased]

### Changed

- Mengonsolidasikan dokumentasi produk, desain, arsitektur, setup, dan changelog ke folder `docs/`.
- Menetapkan **Kertas Hangat & Tanah Liat** sebagai satu-satunya bahasa visual aktif.
- Menetapkan `app/globals.css` sebagai sumber token runtime dan menghapus rujukan dokumentasi terhadap token `--joy-*`.
- Memperbarui dokumentasi agar mencerminkan struktur route dan aturan Firebase aktual.

### Security

- Mendokumentasikan Firebase Anonymous Authentication sebagai prasyarat operasi terlindungi.
- Mendokumentasikan validasi Firestore Rules dan Storage Rules, termasuk batas foto dan tipe file.
- Memperjelas bahwa invite token adalah rahasia akses acak, bukan konten terenkripsi.

## [2.1.0]

### Added

- Ruang privat bersama untuk memories, stories, plans, important dates, dan ambient audio.
- Create room dan join room melalui invite token.
- Identitas perangkat persisten dan proteksi nama anggota ternormalisasi.
- Firebase Anonymous Authentication.
- Validasi input, feedback error inline, dan pengelolaan anggota oleh owner.

### Changed

- Redesign UI/UX menuju pengalaman jurnal dan album foto yang hangat.
- Navigasi mobile-first dengan bottom navigation dan audio dock persisten.
- Kompresi foto di client sebelum upload ke Firebase Storage.

### Security

- Penambahan validasi akses terautentikasi pada Firestore dan Storage Rules.
- Pembatasan jumlah foto memory dan ukuran file Storage.

## Catatan migrasi desain

Migrasi token dari nama lama dan palet coral/pastel ke token `--color-*` Kertas Hangat & Tanah Liat merupakan bagian dari redesign. Implementasi kode masih akan dirapikan bertahap pada fase struktur kode terpisah.
