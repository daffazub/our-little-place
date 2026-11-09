import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'
import { getAuth, Auth, signInAnonymously } from 'firebase/auth'

const publicFirebaseEnvironment = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const missingFirebaseEnvironment = Object.entries(publicFirebaseEnvironment)
  .filter(([, value]) => !value)
  .map(([key]) => key)

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'placeholder-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'placeholder-app.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'placeholder-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'placeholder-app.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456',
}

const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
const db: Firestore = getFirestore(app)
const storage: FirebaseStorage = getStorage(app)
const auth: Auth = getAuth(app)

export function assertFirebaseConfiguration(): void {
  if (missingFirebaseEnvironment.length > 0) {
    throw new Error(
      'Konfigurasi Firebase belum lengkap. Tambahkan NEXT_PUBLIC_FIREBASE_* lalu mulai ulang aplikasi.',
    )
  }
}

export async function ensureAnonymousUser(): Promise<string> {
  assertFirebaseConfiguration()

  if (typeof window === 'undefined') {
    throw new Error('Autentikasi Firebase hanya dapat dijalankan dari browser.')
  }

  try {
    if (auth.currentUser) {
      return auth.currentUser.uid
    }
    const cred = await signInAnonymously(auth)
    return cred.user.uid
  } catch (err) {
    console.error('Firebase anonymous authentication failed:', err)
    throw new Error('Tidak dapat terhubung ke Firebase. Periksa koneksi atau aktifkan Anonymous Authentication.')
  }
}

export { app, db, storage, auth }
