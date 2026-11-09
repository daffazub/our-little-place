# Product Requirements Document

## Our Little Place

Our Little Place adalah ruang privat bersama untuk lingkaran kecil—pasangan, sahabat dekat, atau keluarga—untuk menyimpan foto, cerita, rencana, tanggal penting, dan musik ambient tanpa pola media sosial publik.

## Tujuan produk

- Membuat room tanpa alur pendaftaran email/password.
- Mempertahankan identitas perangkat untuk setiap anggota room.
- Memberi owner kendali atas invite link dan anggota.
- Menyatukan memories, stories, plans, dan important dates dalam satu room.
- Menyediakan pengalaman yang privat, cepat, mudah diakses, dan mobile-first.
- Menggunakan bahasa visual **Kertas Hangat & Tanah Liat** yang tenang dan intim.

## Pengguna

- Pasangan yang menyimpan milestone bersama.
- Sahabat dekat yang merencanakan dan mengingat aktivitas.
- Keluarga kecil yang mengumpulkan momen dan tanggal penting.

## Alur inti

### Membuat room

Pengguna memasukkan nama room, nama tampilan, dan avatar. Browser melakukan Firebase Anonymous Authentication sebelum operasi terlindungi, lalu membuat room, member owner, kunci nama ternormalisasi, dan invite token awal melalui batch Firestore. Token perangkat dan session lokal dipertahankan untuk kunjungan berikutnya.

### Bergabung ke room

Pengunjung membuka URL undangan, memvalidasi token aktif, memilih nama tampilan dan avatar, lalu bergabung sebagai contributor. Transaksi dan dokumen kunci nama mencegah nama duplikat secara case-insensitive serta membantu mencegah identitas perangkat ganda dalam room.

Invite token adalah rahasia akses acak pada URL; token bukan isi terenkripsi. Jangan menaruhnya di log, screenshot publik, atau dokumentasi.

### Menggunakan room

- **Memories:** membuat, mengedit, memfilter, menyukai, dan menghapus kenangan foto; maksimal sepuluh foto per memory.
- **Stories:** menulis jurnal atau cerita bersama.
- **Plans:** menyimpan aktivitas upcoming dan completed.
- **Calendar:** mencatat tanggal penting sekali jalan atau berulang tahunan.
- **Settings:** mengubah profil, mengganti nama room, mengelola invite token, dan mengelola anggota.
- **Audio:** memutar musik melalui dock yang dikelola context global.

## Batasan produk dan keamanan

- Firebase Anonymous Authentication wajib berhasil sebelum operasi data yang dilindungi.
- Validasi client membantu pengalaman pengguna; Firestore Rules dan Storage Rules adalah lapisan enforcement yang harus dideploy.
- Room tidak dapat dihapus dari client.
- Rules Firestore membatasi panjang string utama, status plan, dan jumlah foto memory.
- Storage Rules membatasi ukuran foto hingga kurang dari 5 MB dan audio hingga kurang dari 15 MB, selain membatasi tipe konten.
- Device token tidak boleh ditampilkan kepada anggota lain melalui UI.

## Persyaratan kualitas

- Kontrol dapat digunakan dengan keyboard dan memiliki focus state yang terlihat.
- Kontras teks mengikuti WCAG AA dan error tidak disampaikan hanya dengan warna.
- Layout responsif, dengan bottom navigation dan safe-area support pada perangkat mobile.
- Kegagalan Firebase menghasilkan pesan yang dapat dipahami dan tidak meninggalkan loading state tanpa akhir.
- Foto dikompresi di client sebelum upload untuk mengurangi ukuran transfer.

## Roadmap

- Pengingat tanggal penting dan agenda.
- Upload audio yang dikelola room.
- Ekspor year-in-review.
- Warm dark theme berbasis semantic tokens.
