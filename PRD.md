# Product Requirement Document (PRD)
# Our Little Place (v2.1)

**Status:** Live / Production Ready  
**Versi:** 2.1 (Pembaruan Fitur Keamanan, Validasi & UI/UX)  
**Tanggal Rilis Terakhir:** 13 September 2026  
**Tech Stack Utama:** Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, Firebase (Cloud Firestore & Storage)  
**Live Production URL:** [https://our-little-place-drab.vercel.app](https://our-little-place-drab.vercel.app)

---

## 1. Ikhtisar Produk (Product Overview)

### 1.1 Latar Belakang & Visi
Media sosial konvensional saat ini dipenuhi oleh algoritma rekomendasi, iklan komersial, dan audiens publik yang luas. Pengguna kehilangan ruang privat yang intim dan tenang untuk mendokumentasikan perjalanan hidup bersama orang-orang terdekat (pasangan, sahabat karib, atau keluarga inti).

**Our Little Place** hadir sebagai *private digital sanctuary* — ruang bersama yang eksklusif, hangat, dan estetik. Aplikasi ini memungkinkan lingkaran kecil (*close circle*) untuk menyimpan kenangan foto beresolusi tinggi, menulis jurnal bersama, merencanakan agenda masa depan, serta merayakan momen spesial tanpa distraksi publik.

### 1.2 Tujuan Produk (Goals)
1. **Privasi Penuh & Eksklusivitas:** Akses masuk hanya melalui tautan undangan (*invite link*) terenkripsi yang dapat dimatikan (*revoked*) sewaktu-waktu oleh pemilik ruangan.
2. **Zero Friction & 1 Device 1 Account:** Tidak mewajibkan registrasi akun dengan email/password yang rumit; menggunakan identitas perangkat persisten (*device token*) yang mengikat satu akun per perangkat per room.
3. **Integritas Data & Anti-Duplikasi:** Mencegah spam pendaftaran ganda dari perangkat yang sama dan menjamin keunikan nama anggota (*case-insensitive*) di dalam satu room.
4. **Penyimpanan Cloud 24/7:** Didukung Google Cloud Firestore & Firebase Storage aktif non-stop tanpa auto-pause dengan optimasi kompresi gambar WebP otomatis di sisi klien.
5. **Estetika Hangat & Menenangkan:** Desain hangat berbasis palet warm peach/pastel, tipografi berkarakter, navigasi mobile-first yang ramah jempol, serta pemutar audio latar (*ambient dock*) yang terus berputar saat menjelajah aplikasi.

---

## 2. Target Pengguna & Persona

1. **Pasangan (Couples):**
   - Mengabadikan foto kencan, surat/jurnal cinta, kalender anniversary, dan bucket list liburan masa depan.
2. **Lingkaran Sahabat (Close Circles / Besties, 2–10 orang):**
   - Galeri foto kumpul bersama, mencatat rencana liburan/nongkrong, dan mengingat hari ulang tahun masing-masing sahabat.
3. **Keluarga Inti (Small Family):**
   - Ruang aman bagi orang tua dan anak untuk mengabadikan momen tumbuh kembang dan agenda keluarga tanpa terlihat orang luar.

---

## 3. Fitur Utama & Spesifikasi Fungsional

### 3.1 Manajemen Ruangan, Autentikasi & Keanggotaan
- **Pembuatan Ruangan (Create Room):**
  - Pengguna pertama otomatis menjadi **Owner (Pemilik)**.
  - Memilih nama tempat kenangan, nama panggilan, dan avatar personal.
  - Menghasilkan token identitas perangkat persisten (`olp_device_token`) yang disimpan di `localStorage` dan cookie aman.
- **Aturan 1 Device = 1 Akun:**
  - Perangkat yang sama tidak dapat membuat banyak akun duplikat di dalam satu room.
  - Jika perangkat membuka kembali tautan undangan room yang sudah diikutinya, sistem mengenali sesi perangkat (*"Perangkat ini sudah terhubung sebagai [Nama]"*), dan tombol bertindak untuk masuk kembali/memperbarui profil, bukan membuat akun baru.
- **Validasi Nama Unik per Room:**
  - Nama anggota dalam satu room wajib unik (*case-insensitive & trimmed*).
  - Jika nama sudah terpakai (misal: "Daffa"), pendaftar lain tidak dapat menggunakan nama tersebut dan diberikan notifikasi inline yang ramah.
- **Sistem Undangan & Hak Akses:**
  - Owner dapat membuat tautan undangan baru: `https://.../join/{roomId}/{token}`.
  - Tautan dapat disalin ke clipboard atau dibagikan via Native Web Share API.
  - Owner dapat mencabut (*revoke*) tautan undangan lama kapan saja.
- **Manajemen Anggota (Kick / Keluarkan Anggota):**
  - Owner memiliki wewenang untuk mengeluarkan anggota tidak dikenal atau akun duplikat langsung dari halaman Pengaturan, disertai dialog konfirmasi keamanan.
- **Peringatan & Modal Konfirmasi Keluar (Logout Confirmation):**
  - Mencegah kehilangan sesi yang tidak disengaja baik dari tombol Logout di Navbar atas maupun kartu *"Keluar dari Ruang Kenangan"* di halaman Pengaturan.
  - Menampilkan modal dialog lembut dengan tombol "Batal" dan "Ya, Keluar" (`#FF8C69`).

### 3.2 Galeri Kenangan (Memories Gallery)
- **Unggah Foto & Batas Kuota:**
  - Maksimal **10 foto** per momen kenangan.
  - Counter indikator dinamis: `X / 10 foto dipilih` beserta estimasi ukuran hasil kompresi WebP (`≈ X KB setelah kompresi WebP`).
  - Proteksi ramah (non-fatal warning): Jika user memilih > 10 foto, sistem otomatis membatasi 10 foto pertama tanpa menghapus foto sebelumnya dan menampilkan toast pemberitahuan.
- **Kompresi Otomatis Klien (WebP Engine):**
  - Foto dikompres otomatis ke format WebP (kualitas 82%, max 500 KB) sebelum transfer ke Firebase Storage, menghemat kuota hingga 80%.
- **Metadata Momen:**
  - Judul momen, cerita/catatan, tanggal kejadian (via JoyDatePicker kustom), lokasi, dan kategori (Nongkrong, Liburan, Kuliner, Perayaan, Random).
- **Interaksi & Filter:**
  - Filter kategori horizontal swipeable ramah jempol (`CategoryFilterBar`).
  - Fitur suka (*Like*) instan dengan update array atomik (`arrayUnion` / `arrayRemove`) di Firestore.

### 3.3 Cerita & Jurnal Bersama (Stories & Journals)
- Menuliskan catatan panjang, kisah perjalanan, refleksi emosional, atau surat terbuka untuk dibaca bersama.
- Tampilan kartu artikel kronologis dengan tipografi nyaman dan aksen warna hangat.

### 3.4 Agenda & Rencana (Future Plans & Bucket List)
- Menyusun daftar agenda mendatang dan impian bersama (*bucket list*).
- Informasi: Nama agenda, catatan deskripsi, tanggal kegiatan, jam pelaksanaan, dan lokasi.
- **Status Interaktif:** Checklist satu-klik untuk mengubah status rencana antara *Akan Datang (upcoming)* dan *Terlaksana (completed)*.
- **Filter Bar:** Filter cepat untuk tab *Semua*, *Akan Datang*, dan *Terlaksana*.

### 3.5 Kalender & Tanggal Penting (Important Dates & Milestones)
- Pencatatan hari ulang tahun sahabat/pasangan, anniversary, dan hari istimewa lainnya.
- Penanda berulang tiap tahun (*recurring annually* 🎂).
- Kartu tanggal terurut kronologis dengan dekorasi gradasi peach yang ceria.

### 3.6 Ambient Audio Dock (Persistent Player)
- Pemutar audio latar yang terpasang persisten di bagian bawah layar (*dock*).
- **Persistent:** Musik tetap berputar mulus tanpa jeda saat pengguna berpindah halaman (dikelola via `AudioContext` global).
- Kontrol: Play, Pause, Track Berikutnya/Sebelumnya, Mute/Unmute, dan Seek progress bar.

---

## 4. Standar UI/UX & Validasi Formulir

### 4.1 Validasi Form Client-Side
- **Tanda Bintang Wajib (`*`):** Dicantumkan pada seluruh label kolom wajib di semua formulir (Kenangan, Cerita, Agenda, Kalender, dan Pendaftaran).
- **Pesan Error Inline:** Tampil tepat di bawah kolom yang bermasalah dengan warna merah lembut (`#e05252`), icon `AlertCircle`, dan bahasa yang bersahabat.
- **Highlight Border Halus:** Kolom yang bermasalah mendapatkan highlight border halus berwarna `#e05252`.
- **Auto-Dismiss:** Indikator error otomatis hilang seketika saat pengguna mulai mengetik atau memilih data yang valid.

### 4.2 Pola Header 2-Card & Filter Bar Mobile
- **`PageHeaderCard`:** Komponen header konsisten di seluruh halaman (`memories`, `stories`, `plans`, `calendar`):
  - Padding 24–28px, vertical spacing 12–16px yang lega dan nyaman.
  - Berisi badge momen/kategori, judul utama berkarakter, deskripsi hangat, dan tombol Call-To-Action (CTA) bergradasi.
- **`CategoryFilterBar`:** Komponen bar filter kategori horizontal untuk layar ponsel:
  - `overflow-x: auto` dengan `scroll-snap-type: x mandatory`.
  - Tanpa scrollbar bawaan browser yang kaku (`.no-scrollbar`).
  - Dilengkapi gradasi fade halus di sisi kanan sebagai penanda visual bahwa opsi dapat digeser.

### 4.3 Modal Pemilih Tanggal Kustom (`JoyDatePicker`)
- Dialog pemilih tanggal estetik dengan kalender interaktif, navigasi bulan/tahun cepat, dan preset hari ini / kemarin / besok.

---

## 5. Arsitektur Teknis & Struktur Data

### 5.1 Tech Stack
| Lapisan | Teknologi | Peran & Alasan |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (Turbopack) | React Server & Client Components, App Router performa tinggi. |
| **UI Library** | React 19 + Tailwind CSS v4 | Reaktivitas modern, variabel warna CSS terpusat (`--joy-*`). |
| **Database** | Google Cloud Firestore | NoSQL document database, online 24/7 tanpa batas auto-pause. |
| **Storage** | Firebase Storage | Penyimpanan aman hingga 5 GB untuk ribuan foto kenangan. |
| **Kompresi** | browser-image-compression | Konversi dan kompresi WebP instan di browser klien. |
| **Ikonografi** | Lucide React | Ikon UI modern, konsisten, dan ringan. |
| **Hosting** | Vercel | Deployment otomatis via GitHub CI/CD, SSL otomatis, edge caching. |

### 5.2 Skema Dokumen Firestore (Namespace: `rooms/{roomId}`)
```
rooms/{roomId}
├── name: string
├── owner_id: string
├── created_at: ISO string
│
├── members/{memberId}
│   ├── name: string (Unik per room, case-insensitive)
│   ├── avatar_url: string | null
│   ├── role: 'owner' | 'contributor'
│   ├── device_token: string (1 token per perangkat fisik)
│   └── joined_at: ISO string
│
├── memories/{memoryId}
│   ├── title: string
│   ├── caption: string | null
│   ├── date: string (YYYY-MM-DD)
│   ├── location_name: string | null
│   ├── category: string
│   ├── photos: [{ storage_path, url, is_cover, sort_order }] (Max 10 foto)
│   ├── likes: string[] (array memberId)
│   ├── created_by: string (memberId)
│   └── created_at: ISO string
│
├── stories/{storyId}
│   ├── title: string
│   ├── content: string
│   ├── date: string
│   ├── created_by: string (memberId)
│   └── created_at: ISO string
│
├── plans/{planId}
│   ├── title: string
│   ├── description: string | null
│   ├── date: string
│   ├── time: string | null
│   ├── location: string | null
│   ├── status: 'upcoming' | 'completed'
│   ├── created_by: string (memberId)
│   └── created_at: ISO string
│
├── important_dates/{dateId}
│   ├── title: string
│   ├── date: string
│   ├── recurring: boolean
│   ├── created_by: string (memberId)
│   └── created_at: ISO string
│
└── invite_tokens/{tokenId}
    ├── token: string
    ├── created_by: string (memberId)
    ├── revoked: boolean
    └── created_at: ISO string
```

---

## 6. Persyaratan Non-Fungsional (Kualitas & Keamanan)

1. **Kecepatan & Performa:**
   - Waktu render halaman awal < 1 detik.
   - Kompresi gambar sisi klien memastikan kecepatan unggah cepat bahkan di jaringan seluler lemah.
2. **Keamanan & Privasi:**
   - Akses room terisolasi pada pemilik token undangan aktif.
   - Token perangkat disanitasi saat pemanggilan `getRoomMembers` agar tidak terekspos ke member lain.
   - Pengaturan hak akses Owner untuk aksi berbahaya (cabut token, kick member).
3. **Responsif & Mobile-First:**
   - Bottom Nav Bar ramah jempol di layar mobile.
   - Top Header Bar rapi di layar desktop/tablet.
   - PWA Ready dengan `manifest.json`.

---

## 7. Roadmap Selanjutnya

- [ ] **v2.2:** Notifikasi pengingat hari ulang tahun & agenda rencana terdekat.
- [ ] **v2.3:** Fitur kustomisasi musik latar sendiri ke Audio Dock.
- [ ] **v2.4:** Fitur ekspor kenangan tahunan (*Year in Review / PDF Photobook*).
- [ ] **v2.5:** Tema Gelap Halus (*Warm Dark Mode*).