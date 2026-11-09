# Setup

## Prasyarat

- Node.js versi yang kompatibel dengan Next.js 16.
- npm.
- Project Firebase dengan Cloud Firestore, Firebase Storage, dan Firebase Authentication.
- Firebase CLI jika ingin men-deploy rules dari lokal.
- Akun Vercel untuk deployment production.

## Instalasi lokal

1. Clone repository dan masuk ke folder proyek.
2. Install dependency:

   ```bash
   npm install
   ```

3. Salin `.env.example` menjadi `.env.local`.
4. Isi keenam variable Firebase dari Firebase Console.
5. Aktifkan **Authentication → Sign-in method → Anonymous**, lalu jalankan:

   ```bash
   npm run dev
   ```

Buka `http://localhost:3000`.

## Environment variables

`.env.local` harus berisi enam variable publik berikut:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Nilai tersebut adalah konfigurasi client Firebase, bukan service-account secret. Jangan menambahkan private key atau credential server ke variable `NEXT_PUBLIC_*`. Restart dev server setelah mengubah environment.

## Firebase setup

1. Buat atau pilih Firebase project.
2. Tambahkan Web App dan salin konfigurasi ke `.env.local`.
3. Aktifkan Anonymous Authentication.
4. Buat Cloud Firestore Database.
5. Buat Firebase Storage bucket.
6. Deploy rules dari root repository setelah `firebase.json` tersedia:

   ```bash
   firebase login
   firebase use <firebase-project-id>
   firebase deploy --only firestore:rules,storage
   ```

Rules sumbernya adalah `firestore.rules` dan `storage.rules`. Review perubahan rules sebelum deploy karena rules adalah enforcement keamanan production.

## Vercel deployment

1. Import repository ke Vercel.
2. Pilih framework preset **Next.js**.
3. Tambahkan enam `NEXT_PUBLIC_FIREBASE_*` variable pada Environment Variables untuk environment yang digunakan.
4. Deploy dengan build command default Next.js.
5. Pastikan Anonymous Authentication aktif pada Firebase project yang sama.
6. Tambahkan domain Vercel production dan preview yang dipakai ke **Firebase Console → Authentication → Settings → Authorized domains**.
7. Uji create room, join room, upload foto, dan navigasi room setelah deployment.

Jangan mengandalkan `.env.local` untuk Vercel; variable harus diatur di project Vercel.

## Pemeriksaan sebelum rilis

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Jika server development dijalankan, periksa halaman utama dan alur autentikasi Anonymous melalui browser. Jangan mencetak nilai environment atau invite token ke log.
