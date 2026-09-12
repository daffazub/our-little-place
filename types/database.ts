// ============================================================
// types/database.ts — TypeScript types for all Supabase tables
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

// ---- MEMORIES ----
export interface Memory {
  id: string
  room_id: string
  title: string
  caption: string | null
  story: string | null
  date: string           // ISO date string YYYY-MM-DD
  location_name: string | null
  lat: number | null
  lng: number | null
  mood: string | null
  category: string | null
  created_by: string | null
  created_at: string
  // Joined fields (from queries with select)
  memory_photos?: MemoryPhoto[]
  memory_people?: { member: Member }[]
  reactions?: Reaction[]
  comments?: Comment[]
}

// ---- MEMORY PHOTOS ----
export interface MemoryPhoto {
  id: string
  memory_id: string
  storage_path: string
  sort_order: number
  is_cover: boolean
}

// ---- MEMORY PEOPLE (join table) ----
export interface MemoryPerson {
  memory_id: string
  member_id: string
}

// ---- ALBUMS ----
export interface Album {
  id: string
  room_id: string
  name: string
  cover_path: string | null
  created_at: string
}

// ---- ALBUM MEMORIES (join table) ----
export interface AlbumMemory {
  album_id: string
  memory_id: string
}

// ---- STORIES ----
export interface Story {
  id: string
  room_id: string
  title: string
  cover_photo_path: string | null
  content: string
  date: string
  created_by: string | null
  created_at: string
  // Joined
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
  cover_photo_path: string | null
  created_by: string | null
  created_at: string
  // Joined
  participants?: Member[]
}

// ---- PLAN PARTICIPANTS (join table) ----
export interface PlanParticipant {
  plan_id: string
  member_id: string
}

// ---- QUOTES ----
export interface Quote {
  id: string
  room_id: string
  text: string
  said_by: string
  context: string | null
  date: string
  created_by: string | null
  created_at: string
  // Joined
  likes_count?: number
  is_liked?: boolean
}

// ---- QUOTE LIKES ----
export interface QuoteLike {
  quote_id: string
  member_id: string
  created_at: string
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
}

// ---- REACTIONS ----
export interface Reaction {
  id: string
  memory_id: string
  member_id: string
  emoji: string
  created_at: string
  // Joined
  member?: Member
}

// ---- COMMENTS ----
export interface Comment {
  id: string
  memory_id: string
  member_id: string
  text: string
  created_at: string
  // Joined
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
  memory_id: string | null
  created_by: string | null
  created_at: string
}

// ---- SESSION (local state, not persisted to DB) ----
export interface SessionMember extends Member {
  room: Room
}

