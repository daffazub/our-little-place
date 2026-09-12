'use client'

import { supabase, setSupabaseDeviceToken } from './supabase/client'
import type { Member, Room, SessionMember } from '@/types/database'

// ─── Keys for localStorage / cookie ───────────────────────────
const DEVICE_TOKEN_KEY = 'olp_device_token'
const SESSION_KEY      = 'olp_session'

// ─── Generate a cryptographically random device token ─────────
function generateDeviceToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ─── Persist device_token in localStorage, cookie, and client headers
function saveDeviceToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEVICE_TOKEN_KEY, token)
    const isSecure = window.location.protocol === 'https:'
    const secureFlag = isSecure ? '; Secure' : ''
    document.cookie = `olp_device_token=${token}; path=/; SameSite=Lax; max-age=31536000${secureFlag}`
  }
  setSupabaseDeviceToken(token)
}

export function getDeviceToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(DEVICE_TOKEN_KEY)
}

// ─── Save/load full session ────────────────────────────────────
export function saveSession(session: SessionMember) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }
  setSupabaseDeviceToken(session.device_token)
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
    localStorage.removeItem(DEVICE_TOKEN_KEY)
    localStorage.removeItem(SESSION_KEY)
    const isSecure = window.location.protocol === 'https:'
    const secureFlag = isSecure ? '; Secure' : ''
    document.cookie = `olp_device_token=; path=/; max-age=0; SameSite=Lax${secureFlag}`
  }
  setSupabaseDeviceToken('')
}

// ─── Create new room + owner member ───────────────────────────
export async function createRoom(
  roomName: string,
  ownerName: string,
  avatarUrl?: string
): Promise<SessionMember> {
  const deviceToken = generateDeviceToken()
  saveDeviceToken(deviceToken)

  // Try RPC first for atomic transaction if available
  try {
    const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('create_room_with_owner', {
      p_room_name: roomName,
      p_owner_name: ownerName,
      p_avatar_url: avatarUrl ?? null,
      p_device_token: deviceToken,
    })

    if (!rpcError && rpcData?.room && rpcData?.member) {
      const session: SessionMember = {
        ...rpcData.member,
        room: rpcData.room,
      }
      saveSession(session)
      return session
    }
  } catch {
    // Fall back to direct queries below
  }

  // Direct queries fallback
  // 1. Insert room (owner_id set after we have member id)
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({ name: roomName })
    .select()
    .single()

  if (roomError || !room) throw new Error(roomError?.message ?? 'Failed to create room')

  // 2. Insert owner member
  const { data: member, error: memberError } = await supabase
    .from('members')
    .insert({
      room_id: room.id,
      name: ownerName,
      avatar_url: avatarUrl ?? null,
      role: 'owner',
      device_token: deviceToken,
    })
    .select()
    .single()

  if (memberError || !member) throw new Error(memberError?.message ?? 'Failed to create member')

  // 3. Update room.owner_id
  await supabase.from('rooms').update({ owner_id: member.id }).eq('id', room.id)

  // 4. Auto-generate first invite token
  await supabase.from('invite_tokens').insert({ room_id: room.id, created_by: member.id })

  const session: SessionMember = { ...member, room: { ...room, owner_id: member.id } }
  saveSession(session)
  return session
}

// ─── Join room via invite token ────────────────────────────────
export async function joinRoom(
  roomId: string,
  inviteToken: string,
  memberName: string,
  avatarUrl?: string
): Promise<SessionMember> {
  const deviceToken = generateDeviceToken()
  saveDeviceToken(deviceToken)

  // Try RPC first for atomic transaction
  try {
    const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('join_room_with_invite', {
      p_room_id: roomId,
      p_invite_token: inviteToken,
      p_name: memberName,
      p_avatar_url: avatarUrl ?? null,
      p_device_token: deviceToken,
    })

    if (!rpcError && rpcData?.room && rpcData?.member) {
      const session: SessionMember = {
        ...rpcData.member,
        room: rpcData.room,
      }
      saveSession(session)
      return session
    }
  } catch {
    // Fall back to direct queries below
  }

  // Direct queries fallback
  // 1. Validate token
  const { data: tokenRow, error: tokenError } = await supabase
    .from('invite_tokens')
    .select('*')
    .eq('room_id', roomId)
    .eq('token', inviteToken)
    .eq('revoked', false)
    .single()

  if (tokenError || !tokenRow) throw new Error('Invite link tidak valid atau sudah kadaluarsa.')

  // 2. Get room
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (roomError || !room) throw new Error('Room tidak ditemukan.')

  // 3. Insert contributor member
  const { data: member, error: memberError } = await supabase
    .from('members')
    .insert({
      room_id: roomId,
      name: memberName,
      avatar_url: avatarUrl ?? null,
      role: 'contributor',
      device_token: deviceToken,
    })
    .select()
    .single()

  if (memberError || !member) throw new Error(memberError?.message ?? 'Gagal bergabung ke room')

  const session: SessionMember = { ...member, room }
  saveSession(session)
  return session
}

// ─── Generate new invite token (owner only) ───────────────────
export async function generateInviteToken(
  roomId: string,
  memberId: string
): Promise<string> {
  const { data, error } = await supabase
    .from('invite_tokens')
    .insert({ room_id: roomId, created_by: memberId })
    .select('token')
    .single()

  if (error || !data) throw new Error('Gagal membuat invite token')
  return data.token
}

// ─── Revoke invite token (owner only) ─────────────────────────
export async function revokeInviteToken(tokenId: string): Promise<void> {
  const { error } = await supabase
    .from('invite_tokens')
    .update({ revoked: true })
    .eq('id', tokenId)

  if (error) throw new Error('Gagal merevoke token')
}

// ─── Get all members in a room (safe profile fields only) ─────
export async function getRoomMembers(roomId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('id, room_id, name, avatar_url, role, joined_at')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data as unknown as Member[]) ?? []
}

// ─── Get active invite tokens for a room (owner view) ─────────
export async function getActiveInviteTokens(roomId: string) {
  const { data, error } = await supabase
    .from('invite_tokens')
    .select('*')
    .eq('room_id', roomId)
    .eq('revoked', false)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}
