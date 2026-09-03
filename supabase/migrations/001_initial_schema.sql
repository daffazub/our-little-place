-- ============================================================
-- Our Little Place v2 — Migration 001: Initial Schema
-- Run in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ROOMS
-- ============================================================
CREATE TABLE IF NOT EXISTS rooms (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  owner_id      UUID,                          -- FK to members (set after insert)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'contributor'
                  CHECK (role IN ('owner', 'contributor')),
  device_token  TEXT NOT NULL UNIQUE,
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_members_room_id ON members(room_id);
CREATE INDEX IF NOT EXISTS idx_members_device_token ON members(device_token);

-- Now add FK from rooms.owner_id → members.id
ALTER TABLE rooms
  ADD CONSTRAINT fk_rooms_owner
  FOREIGN KEY (owner_id) REFERENCES members(id) ON DELETE SET NULL;

-- ============================================================
-- MEMORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS memories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  caption         TEXT,
  story           TEXT,
  date            DATE NOT NULL,
  location_name   TEXT,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  mood            TEXT,
  category        TEXT,
  created_by      UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memories_room_id   ON memories(room_id);
CREATE INDEX IF NOT EXISTS idx_memories_date       ON memories(date);
CREATE INDEX IF NOT EXISTS idx_memories_created_by ON memories(created_by);

-- ============================================================
-- MEMORY PHOTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS memory_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id     UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_cover      BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_memory_photos_memory_id ON memory_photos(memory_id);

-- ============================================================
-- MEMORY PEOPLE (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS memory_people (
  memory_id   UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  member_id   UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  PRIMARY KEY (memory_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_memory_people_member_id ON memory_people(member_id);

-- ============================================================
-- ALBUMS
-- ============================================================
CREATE TABLE IF NOT EXISTS albums (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id   UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  cover_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_albums_room_id ON albums(room_id);

-- ============================================================
-- ALBUM MEMORIES (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS album_memories (
  album_id    UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  memory_id   UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  PRIMARY KEY (album_id, memory_id)
);

-- ============================================================
-- STORIES (Jurnal cerita panjang)
-- ============================================================
CREATE TABLE IF NOT EXISTS stories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  cover_photo_path TEXT,
  content         TEXT NOT NULL,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by      UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stories_room_id ON stories(room_id);

-- ============================================================
-- PLANS (Agenda Masa Depan)
-- ============================================================
CREATE TABLE IF NOT EXISTS plans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id          UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  date             DATE NOT NULL,
  time             TIME,
  location         TEXT,
  status           TEXT NOT NULL DEFAULT 'upcoming'
                     CHECK (status IN ('upcoming', 'in_progress', 'completed')),
  cover_photo_path TEXT,
  created_by       UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plans_room_id ON plans(room_id);
CREATE INDEX IF NOT EXISTS idx_plans_date    ON plans(date);

-- ============================================================
-- PLAN PARTICIPANTS (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS plan_participants (
  plan_id   UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  PRIMARY KEY (plan_id, member_id)
);

-- ============================================================
-- QUOTES & INSIDE JOKES
-- ============================================================
CREATE TABLE IF NOT EXISTS quotes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  said_by    TEXT NOT NULL,
  context    TEXT,
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotes_room_id ON quotes(room_id);

-- ============================================================
-- LITTLE THINGS (Hal-Hal Kecil)
-- ============================================================
CREATE TABLE IF NOT EXISTS little_things (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_little_things_room_id ON little_things(room_id);

-- ============================================================
-- IMPORTANT DATES (Anniversary, ultah, dll)
-- ============================================================
CREATE TABLE IF NOT EXISTS important_dates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  date       DATE NOT NULL,
  recurring  BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES members(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_important_dates_room_id ON important_dates(room_id);

-- ============================================================
-- REACTIONS (emoji realtime)
-- ============================================================
CREATE TABLE IF NOT EXISTS reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id  UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  member_id  UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  emoji      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (memory_id, member_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_memory_id ON reactions(memory_id);
CREATE INDEX IF NOT EXISTS idx_reactions_member_id ON reactions(member_id);

-- ============================================================
-- COMMENTS (realtime)
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id  UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  member_id  UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_memory_id ON comments(memory_id);

-- ============================================================
-- INVITE TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS invite_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id    UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64url'),
  created_by UUID REFERENCES members(id) ON DELETE SET NULL,
  revoked    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invite_tokens_room_id ON invite_tokens(room_id);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_token   ON invite_tokens(token);

-- ============================================================
-- MUSIC TRACKS
-- ============================================================
CREATE TABLE IF NOT EXISTS music_tracks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  artist       TEXT,
  storage_path TEXT NOT NULL,
  memory_id    UUID REFERENCES memories(id) ON DELETE SET NULL,
  created_by   UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_music_tracks_room_id ON music_tracks(room_id);

-- ============================================================
-- QUOTE LIKES (many-to-many for quote hearts)
-- ============================================================
CREATE TABLE IF NOT EXISTS quote_likes (
  quote_id   UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  member_id  UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (quote_id, member_id)
);
