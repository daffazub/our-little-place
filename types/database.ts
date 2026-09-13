// ============================================================
// types/database.ts — TypeScript types for Our Little Place
// Compatible with Firebase Firestore
// ============================================================

export type MemberRole = 'owner' | 'contributor'
export type PlanStatus = 'upcoming' | 'in_progress' | 'completed'

// ---- ROOMS ----
export interface Room {
  id: string
  name: string
  owner_id: string | null
  created_at: string
}

// ---- MEMBERS ----
export interface Member {
  id: string
  room_id: string
  name: string
  avatar_url: string | null
  role: MemberRole
  device_token: string
  joined_at: string
}

// ---- PHOTO OBJECT ----
export interface PhotoItem {
  id?: string
  storage_path: string
  url?: string
  sort_order?: number
  is_cover?: boolean
}

// ---- MEMORIES ----
export interface Memory {
  id: string
  room_id: string
  title: string
  caption: string | null
  story: string | null
  date: string           // ISO date string YYYY-MM-DD
  location_name: string | null
  lat?: number | null
  lng?: number | null
  mood?: string | null
  category: string | null
  created_by: string | null
  created_at: string
  photos?: PhotoItem[]
  memory_photos?: MemoryPhoto[] // alias for compatibility
  likes?: string[]             // array of member IDs who liked
  reactions?: Reaction[]
  comments?: Comment[]
}

// ---- MEMORY PHOTOS (compatibility) ----
export interface MemoryPhoto {
  id: string
  memory_id?: string
  storage_path: string
  sort_order?: number
  is_cover?: boolean
}

// ---- STORIES ----
export interface Story {
  id: string
  room_id: string
  title: string
  cover_photo_path?: string | null
  content: string
  date: string
  created_by: string | null
  created_at: string
  author?: Member
}

// ---- PLANS ----
export interface Plan {
  id: string
  room_id: string
  title: string
  description: string | null
  date: string
  time: string | null
  location: string | null
  status: PlanStatus
  cover_photo_path?: string | null
  created_by: string | null
  created_at: string
  participants?: Member[]
}

// ---- QUOTES ----
export interface Quote {
  id: string
  room_id: string
  text: string
  said_by: string
  context: string | null
  date?: string
  likes?: string[] // array of member IDs
  likes_count?: number
  is_liked?: boolean
  created_by: string | null
  created_at: string
  quote_likes?: { member_id: string }[]
}

// ---- LITTLE THINGS ----
export interface LittleThing {
  id: string
  room_id: string
  text: string
  date: string
  created_by: string | null
  created_at: string
}

// ---- IMPORTANT DATES ----
export interface ImportantDate {
  id: string
  room_id: string
  title: string
  date: string
  recurring: boolean
  created_by: string | null
  created_at?: string
}

// ---- REACTIONS ----
export interface Reaction {
  id: string
  memory_id?: string
  member_id: string
  emoji: string
  created_at: string
  member?: Member
}

// ---- COMMENTS ----
export interface Comment {
  id: string
  memory_id?: string
  member_id: string
  text: string
  created_at: string
  member?: Member
}

// ---- INVITE TOKENS ----
export interface InviteToken {
  id: string
  room_id: string
  token: string
  created_by: string | null
  revoked: boolean
  created_at: string
}

// ---- MUSIC TRACKS ----
export interface MusicTrack {
  id: string
  room_id: string
  title: string
  artist: string | null
  storage_path: string
  memory_id?: string | null
  created_by: string | null
  created_at: string
}

// ---- SESSION (local state, persisted to localStorage / cookie) ----
export interface SessionMember extends Member {
  room: Room
}
