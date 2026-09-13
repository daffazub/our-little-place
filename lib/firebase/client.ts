import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'
import { getAuth, Auth, signInAnonymously } from 'firebase/auth'

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

export async function ensureAnonymousUser(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  try {
    if (auth.currentUser) {
      return auth.currentUser.uid
    }
    const cred = await signInAnonymously(auth)
    return cred.user.uid
  } catch (err) {
    console.warn('Anonymous auth note (can be enabled in Firebase Console):', err)
    return null
  }
}

export { app, db, storage, auth }
