# Product Requirement Document (PRD)
# Our Little Place (v2)

**Status:** Live / Active Development  
**Versi:** 2.0  
**Tanggal:** 13 September 2026  
**Tech Stack Utama:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Firebase (Cloud Firestore & Storage)

---

## 1. Ikhtisar Produk (Product Overview)

### 1.1 Latar Belakang & Visi
Media sosial konvensional (Instagram, TikTok, dll.) saat ini dipenuhi oleh algoritma, iklan, dan audiens publik. Pengguna kehilangan ruang privat yang intim dan tenang untuk mendokumentasikan perjalanan hidup bersama orang-orang terdekat (pasangan, sahabat karib, atau keluarga inti).

**Our Little Place** hadir sebagai *private digital sanctuary* — ruang bersama yang eksklusif, hangat, dan estetik. Aplikasi ini memungkinkan lingkaran kecil (circle) untuk menyimpan kenangan foto beresolusi tinggi, menulis jurnal bersama, merencanakan agenda masa depan, serta merayakan momen spesial tanpa distraksi publik.

### 1.2 Tujuan Produk (Goals)
1. **Privasi Penuh:** Akses masuk hanya melalui tautan undangan (*invite link*) yang terenkripsi dan dapat dicabut sewaktu-waktu oleh pemilik ruangan.
2. **Kemudahan Akses (Zero Friction):** Tidak mewajibkan registrasi akun dengan email/password rumit; menggunakan identitas perangkat (*device token*) yang aman.
3. **Penyimpanan Lega & Awet:** Menggunakan Google Firebase Cloud Firestore & Storage (kapasitas 5 GB gratis) yang aktif 24/7 tanpa risiko hibernasi otomatis.
4. **Pengalaman Hangat & Tenang:** Desain antarmuka lembut, animasi halus, dan pemutar audio latar (*ambient audio dock*) yang terus berputar saat menjelajah aplikasi.

---

## 2. Target Pengguna & Persona (User Personas)

1. **Pasangan (Couples):**
   - Ingin ruang bersama untuk mengabadikan foto kencan, surat/jurnal cinta, kalender anniversary, dan bucket list liburan masa depan.
2. **Lingkaran Sahabat (Close Circles / Besties, 2–10 orang):**
   - Ingin galeri foto kumpul bersama, mencatat rencana liburan/nongkrong, dan mengingat ulang tahun masing-masing sahabat.
3. **Keluarga Inti (Small Family):**
   - Ruang aman bagi orang tua dan anak untuk mengabadikan momen tumbuh kembang dan agenda keluarga tanpa terlihat orang luar.

---

## 3. Fitur Utama & Spesifikasi Fungsional

### 3.1 Manajemen Ruangan & Keanggotaan (Room & Members)
- **Buat Ruangan (Create Room):**
  - Pengguna pertama otomatis menjadi **Owner (Pemilik)**.
  - Memilih nama tempat kenangan dan nama panggilan serta avatar personal.
  - Sistem membuat `roomId` unik dan `device_token` yang disimpan pada cookie aman (`SameSite=Lax`, `Secure`).
- **Sistem Undangan (Invite Tokens):**
  - Owner dapat membuat tautan undangan baru: `https://.../join/{roomId}/{token}`.
  - Tautan dapat disalin ke clipboard atau dibagikan melalui Native Web Share API.
  - Owner memiliki kontrol penuh untuk mematikan (*revoke*) tautan lama kapan saja.
- **Bergabung ke Ruangan (Join Room):**
  - Anggota baru masuk via tautan undangan, memilih avatar, dan langsung terdaftar sebagai **Contributor (Sahabat)**.

### 3.2 Galeri Kenangan (Memories Gallery)
- **Unggah Momen Foto:**
  - Mendukung multi-photo upload dari galeri perangkat.
  - **Auto-Kompresi WebP:** Gambar dikompresi otomatis di sisi klien (`browser-image-compression`) ke format WebP (kualitas 82%, max 500 KB) sebelum diunggah ke Firebase Storage, menghemat kuota hingga 80%.
  - Menyimpan metadata: Judul momen, cerita/catatan, tanggal kejadian, lokasi, dan kategori (Nongkrong, Liburan, Kuliner, Perayaan, Random).
- **Interaksi & Filter:**
  - Filter cepat berdasarkan kategori momen.
  - Fitur suka (*Like*) instan menggunakan pembaruan array atomik (`arrayUnion` / `arrayRemove`) di Firestore.

### 3.3 Cerita & Jurnal Bersama (Stories & Journals)
- Menuliskan catatan panjang, kisah perjalanan, refleksi emosional, atau surat terbuka untuk dibaca bersama.
- Tampilan berbasis kartu (*article card*) kronologis yang nyaman dibaca dengan tipografi ramah mata.

### 3.4 Agenda & Rencana (Future Plans & Bucket List)
- Menyusun daftar keinginan (*bucket list*) dan rencana kegiatan mendatang.
- Informasi lengkap: Judul agenda, deskripsi, tanggal, jam pelaksanaan, dan lokasi.
- **Interaktif:** Tombol checklist satu-klik untuk menandai rencana yang sudah terlaksana (*completed*) atau akan datang (*upcoming*).
- Filter tab: *Semua*, *Akan Datang*, dan *Terlaksana*.

### 3.5 Kalender & Tanggal Penting (Important Dates & Milestones)
- Pencatatan hari ulang tahun anggota, anniversary pertemanan/pasangan, dan perayaan penting lainnya.
- Penanda berulang tahunan (*recurring annually* 🎂).
- Tampilan kartu tanggal rapi berurutan berdasarkan waktu.

### 3.6 Ambient Audio Dock (Persistent Player)
- Pemutar musik/audio latar yang terpasang di bagian bawah layar (*dock*).
- **Persistent:** Audio tidak pernah mati atau terputus saat pengguna berpindah halaman (dikelola via `AudioContext` global).
- Kontrol: Play, Pause, Next, Previous, Mute/Unmute, dan Seek progress bar.

---

## 4. Arsitektur Teknis & Struktur Data

### 4.1 Tech Stack
| Lapisan | Teknologi | Alasan Pemilihan |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (Turbopack) | App Router modern, performa tinggi, zero config route. |
| **UI Library** | React 19 + Tailwind CSS v4 | Reaktivitas terbaru, variabel tema CSS kustom modern. |
| **Database** | Google Cloud Firestore | NoSQL document database, aktif 24/7 tanpa auto-pause. |
| **File Storage** | Firebase Storage | Kapasitas gratis 5 GB untuk ribuan foto beresolusi tinggi. |
| **Kompresi** | browser-image-compression | Mengurangi ukuran file foto sebelum transfer ke cloud. |
| **Ikonografi** | Lucide React | Koleksi ikon clean dan konsisten. |

### 4.2 Skema Dokumen Firestore (NoSQL Architecture)
Semua subkoleksi berada di bawah namespace `rooms/{roomId}` untuk isolasi data:

```
rooms/{roomId}
├── name: string
├── owner_id: string
├── created_at: ISO string
│
├── members/{memberId}
│   ├── name: string
│   ├── avatar_url: string | null
│   ├── role: 'owner' | 'contributor'
│   ├── device_token: string (terenkripsi lokal)
│   └── joined_at: ISO string
│
├── memories/{memoryId}
│   ├── title: string
│   ├── caption: string | null
│   ├── date: string (YYYY-MM-DD)
│   ├── location_name: string | null
│   ├── category: string
│   ├── photos: [{ storage_path, url, is_cover }]
│   ├── likes: string[] (array memberId)
│   ├── created_by: string
│   └── created_at: ISO string
│
├── stories/{storyId}
│   ├── title: string
│   ├── content: string
│   ├── date: string
│   ├── created_by: string
│   └── created_at: ISO string
│
├── plans/{planId}
│   ├── title: string
│   ├── description: string | null
│   ├── date: string
│   ├── time: string | null
│   ├── location: string | null
│   ├── status: 'upcoming' | 'completed'
│   ├── created_by: string
│   └── created_at: ISO string
│
├── important_dates/{dateId}
│   ├── title: string
│   ├── date: string
│   ├── recurring: boolean
│   ├── created_by: string
│   └── created_at: ISO string
│
└── invite_tokens/{tokenId}
    ├── token: string
    ├── created_by: string
    ├── revoked: boolean
    └── created_at: ISO string
```

---

## 5. Non-Functional Requirements (Kualitas & Keamanan)

1. **Kecepatan & Performa:**
   - Waktu render halaman awal < 1 detik.
   - Pemuatan foto instan menggunakan direct Download URL dari Firebase Storage.
2. **Keamanan (Security):**
   - Akses dibatasi pada pemegang invite link yang sah.
   - Sanitasi token: Daftar anggota (`getRoomMembers`) tidak pernah membocorkan `device_token` ke perangkat anggota lain.
   - Aturan Firebase Rules terisolasi pada cakupan dokumen room yang valid.
3. **Responsif & Mobile-First:**
   - Navbar atas untuk layar desktop/tablet.
   - Bottom Bar navigasi jempol untuk layar HP/ponsel.
   - Mendukung instalasi Web App (PWA) melalui `public/manifest.json`.

---

## 6. Roadmap Pengembangan Selanjutnya (Future Roadmap)

- [ ] **v2.1:** Notifikasi otomatis pengingat ulang tahun & agenda rencana terdekat.
- [ ] **v2.2:** Unggah musik latar kustom sendiri ke Audio Dock.
- [ ] **v2.3:** Fitur ekspor kenangan tahunan (*Year in Review / PDF Photobook*).
- [ ] **v2.4:** Dukungan mode gelap (*Dark Mode toggle*).