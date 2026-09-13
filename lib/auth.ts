'use client'

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db, ensureAnonymousUser } from './firebase/client'
import type { Member, Room, SessionMember, InviteToken } from '@/types/database'

// ─── Keys for localStorage / cookie ───────────────────────────
const DEVICE_TOKEN_KEY = 'olp_device_token'
const SESSION_KEY      = 'olp_session'

// ─── Generate a cryptographically random device token ─────────
export function generateDeviceToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function generateRandomToken(len = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let res = ''
  for (let i = 0; i < len; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return res
}

// ─── Persist device_token in localStorage and cookie ──────────
export function saveDeviceToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEVICE_TOKEN_KEY, token)
    const isSecure = window.location.protocol === 'https:'
    const secureFlag = isSecure ? '; Secure' : ''
    document.cookie = `olp_device_token=${token}; path=/; SameSite=Lax; max-age=31536000${secureFlag}`
  }
}

export function getDeviceToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(DEVICE_TOKEN_KEY)
}

// ─── Get or create persistent device token (1 Device Identity) ─
export function getOrCreateDeviceToken(): string {
  if (typeof window !== 'undefined') {
    let token = localStorage.getItem(DEVICE_TOKEN_KEY)
    if (!token) {
      const match = document.cookie.match(new RegExp('(^| )olp_device_token=([^;]+)'))
      if (match && match[2]) {
        token = match[2]
      }
    }
    if (!token) {
      token = generateDeviceToken()
    }
    saveDeviceToken(token)
    return token
  }
  return generateDeviceToken()
}

// ─── Save/load full session ────────────────────────────────────
export function saveSession(session: SessionMember) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    saveDeviceToken(session.device_token)
  }
}

export function loadSession(): SessionMember | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionMember
  } catch {
    return null
  }
}

export function clearSession() {
  if (typeof window !== 'undefined') {
    // Clear room session but PRESERVE device identity so 1 device = 1 account is maintained
    localStorage.removeItem(SESSION_KEY)
  }
}

// ─── Create new room + owner member ───────────────────────────
// ─── Create new room + owner member ───────────────────────────
export async function createRoom(
  roomName: string,
  ownerName: string,
  avatarUrl?: string
): Promise<SessionMember> {
  await ensureAnonymousUser()
  const deviceToken = getOrCreateDeviceToken()

  const now = new Date().toISOString()

  // 1. Create Room document
  const roomRef = doc(collection(db, 'rooms'))
  const roomId = roomRef.id

  // 2. Create Owner Member document in subcollection
  const memberRef = doc(collection(db, 'rooms', roomId, 'members'))
  const memberId = memberRef.id

  const memberData: Member = {
    id: memberId,
    room_id: roomId,
    name: ownerName.trim(),
    avatar_url: avatarUrl ?? null,
    role: 'owner',
    device_token: deviceToken,
    joined_at: now,
  }

  const roomData: Room = {
    id: roomId,
    name: roomName.trim(),
    owner_id: memberId,
    created_at: now,
  }

  // Save room & member
  await setDoc(roomRef, roomData)
  await setDoc(memberRef, memberData)

  // 3. Create initial invite token
  const token = generateRandomToken(20)
  const tokenRef = doc(collection(db, 'rooms', roomId, 'invite_tokens'))
  const tokenData: InviteToken = {
    id: tokenRef.id,
    room_id: roomId,
    token,
    created_by: memberId,
    revoked: false,
    created_at: now,
  }
  await setDoc(tokenRef, tokenData)

  const session: SessionMember = {
    ...memberData,
    room: roomData,
  }

  saveSession(session)
  return session
}

// ─── Check if current device already has a member in room ────
export async function checkExistingDeviceMember(roomId: string): Promise<Member | null> {
  try {
    const deviceToken = getOrCreateDeviceToken()
    const q = query(
      collection(db, 'rooms', roomId, 'members'),
      where('device_token', '==', deviceToken)
    )
    const snap = await getDocs(q)
    if (!snap.empty) {
      const d = snap.docs[0]
      return { id: d.id, ...d.data() } as Member
    }
    return null
  } catch (err) {
    console.error('checkExistingDeviceMember error:', err)
    return null
  }
}

// ─── Check if name is already taken in room (case-insensitive) ─
export async function isMemberNameTaken(
  roomId: string,
  targetName: string,
  excludeMemberId?: string
): Promise<boolean> {
  try {
    const snap = await getDocs(collection(db, 'rooms', roomId, 'members'))
    const clean = targetName.trim().toLowerCase()
    return snap.docs.some(d => {
      if (excludeMemberId && d.id === excludeMemberId) return false
      const name = ((d.data().name as string) || '').trim().toLowerCase()
      return name === clean
    })
  } catch (err) {
    console.error('isMemberNameTaken error:', err)
    return false
  }
}

// ─── Validate Invite Token ────────────────────────────────────
export async function validateInviteToken(
  roomId: string,
  token: string
): Promise<{ valid: boolean; room?: Room }> {
  try {
    const q = query(
      collection(db, 'rooms', roomId, 'invite_tokens'),
      where('token', '==', token),
      where('revoked', '==', false)
    )
    const tokenSnap = await getDocs(q)
    if (tokenSnap.empty) {
      return { valid: false }
    }

    const roomSnap = await getDoc(doc(db, 'rooms', roomId))
    if (!roomSnap.exists()) {
      return { valid: false }
    }

    return {
      valid: true,
      room: { id: roomSnap.id, ...roomSnap.data() } as Room,
    }
  } catch (err) {
    console.error('Validate invite token error:', err)
    return { valid: false }
  }
}

// ─── Join room via invite token (1 Device = 1 Akun & Nama Unik) ─
export async function joinRoom(
  roomId: string,
  inviteToken: string,
  memberName: string,
  avatarUrl?: string
): Promise<SessionMember> {
  await ensureAnonymousUser()
  const deviceToken = getOrCreateDeviceToken()

  const validation = await validateInviteToken(roomId, inviteToken)
  if (!validation.valid || !validation.room) {
    throw new Error('Invite link tidak valid atau sudah kadaluarsa.')
  }

  const cleanName = memberName.trim()
  if (!cleanName) {
    throw new Error('Nama kamu tidak boleh kosong.')
  }

  // 1. Cek apakah device ini sudah pernah bergabung di room ini
  const existingDeviceMember = await checkExistingDeviceMember(roomId)

  // 2. Validasi Keunikan Nama per Room (Case-Insensitive)
  const nameTaken = await isMemberNameTaken(roomId, cleanName, existingDeviceMember?.id)
  if (nameTaken) {
    throw new Error(`Nama "${cleanName}" sudah digunakan oleh anggota lain di room ini. Silakan gunakan nama/panggilan lain ya!`)
  }

  const now = new Date().toISOString()
  let memberData: Member

  if (existingDeviceMember) {
    // 1 Device = 1 Akun: Perbarui data profil member yang sudah ada pada device ini
    const memberRef = doc(db, 'rooms', roomId, 'members', existingDeviceMember.id)
    const updatedFields: Partial<Member> = {
      name: cleanName,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      device_token: deviceToken,
    }
    await updateDoc(memberRef, updatedFields)

    memberData = {
      ...existingDeviceMember,
      name: cleanName,
      avatar_url: avatarUrl || existingDeviceMember.avatar_url,
      device_token: deviceToken,
    }
  } else {
    // Member baru untuk device ini
    const memberRef = doc(collection(db, 'rooms', roomId, 'members'))
    const memberId = memberRef.id

    memberData = {
      id: memberId,
      room_id: roomId,
      name: cleanName,
      avatar_url: avatarUrl ?? null,
      role: 'contributor',
      device_token: deviceToken,
      joined_at: now,
    }

    await setDoc(memberRef, memberData)
  }

  const session: SessionMember = {
    ...memberData,
    room: validation.room,
  }

  saveSession(session)
  return session
}

// ─── Generate new invite token (owner only) ───────────────────
export async function generateInviteToken(
  roomId: string,
  memberId: string
): Promise<string> {
  const token = generateRandomToken(20)
  const tokenRef = doc(collection(db, 'rooms', roomId, 'invite_tokens'))
  const tokenData: InviteToken = {
    id: tokenRef.id,
    room_id: roomId,
    token,
    created_by: memberId,
    revoked: false,
    created_at: new Date().toISOString(),
  }
  await setDoc(tokenRef, tokenData)
  return token
}

// ─── Revoke invite token (owner only) ─────────────────────────
export async function revokeInviteToken(roomId: string, tokenId: string): Promise<void> {
  const tokenRef = doc(db, 'rooms', roomId, 'invite_tokens', tokenId)
  await updateDoc(tokenRef, { revoked: true })
}

// ─── Get all members in a room (safe profile fields only) ─────
export async function getRoomMembers(roomId: string): Promise<Member[]> {
  try {
    const membersSnap = await getDocs(collection(db, 'rooms', roomId, 'members'))
    return membersSnap.docs.map(d => {
      const data = d.data()
      return {
        id: d.id,
        room_id: roomId,
        name: data.name || 'Teman',
        avatar_url: data.avatar_url || null,
        role: data.role || 'contributor',
        device_token: '', // Sanitize device_token for privacy
        joined_at: data.joined_at || '',
      } as Member
    })
  } catch (err) {
    console.error('getRoomMembers error:', err)
    return []
  }
}

// ─── Get active invite tokens for a room (owner view) ─────────
export async function getActiveInviteTokens(roomId: string): Promise<InviteToken[]> {
  try {
    const q = query(
      collection(db, 'rooms', roomId, 'invite_tokens'),
      where('revoked', '==', false)
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as InviteToken))
  } catch (err) {
    console.error('getActiveInviteTokens error:', err)
    return []
  }
}

// ─── Remove member from room (owner action) ───────────────────
export async function removeMember(roomId: string, memberId: string): Promise<void> {
  const memberRef = doc(db, 'rooms', roomId, 'members', memberId)
  await deleteDoc(memberRef)
}

