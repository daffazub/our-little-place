-- ============================================================
-- Our Little Place v2 — Migration 002: Row Level Security
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- Helper function: verify device_token is a member of a room
-- ============================================================
CREATE OR REPLACE FUNCTION is_room_member(p_room_id UUID, p_device_token TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE room_id = p_room_id
      AND device_token = p_device_token
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- Helper function: get member id from device_token + room_id
-- ============================================================
CREATE OR REPLACE FUNCTION get_member_id(p_room_id UUID, p_device_token TEXT)
RETURNS UUID AS $$
  SELECT id FROM members
  WHERE room_id = p_room_id
    AND device_token = p_device_token
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- Helper function: check if device_token is owner of room
-- ============================================================
CREATE OR REPLACE FUNCTION is_room_owner(p_room_id UUID, p_device_token TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM members
    WHERE room_id = p_room_id
      AND device_token = p_device_token
      AND role = 'owner'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE rooms            ENABLE ROW LEVEL SECURITY;
ALTER TABLE members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_photos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_people    ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums           ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_memories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans            ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_likes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE little_things    ENABLE ROW LEVEL SECURITY;
ALTER TABLE important_dates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_tokens    ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_tracks     ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ROOMS policies
-- ============================================================
-- Allow reading if device is a member of that room OR room has an active invite link
CREATE POLICY "rooms_select_member" ON rooms
  FOR SELECT USING (
    is_room_member(id, current_setting('request.headers', true)::json->>'x-device-token')
    OR EXISTS (
      SELECT 1 FROM invite_tokens t
      WHERE t.room_id = id
        AND t.revoked = false
    )
  );

-- Allow create (used when creating room — no check needed yet)
CREATE POLICY "rooms_insert_all" ON rooms
  FOR INSERT WITH CHECK (true);

-- Allow owner to update room name etc.
CREATE POLICY "rooms_update_owner" ON rooms
  FOR UPDATE USING (
    is_room_owner(id, current_setting('request.headers', true)::json->>'x-device-token')
  );

-- ============================================================
-- MEMBERS policies
-- ============================================================
CREATE POLICY "members_select_room" ON members
  FOR SELECT USING (
    is_room_member(room_id, current_setting('request.headers', true)::json->>'x-device-token')
  );

-- Allow insert: owner only if room is brand new; contributor only if active invite token exists
CREATE POLICY "members_insert_first_owner" ON members
  FOR INSERT WITH CHECK (
    role = 'owner'
    AND NOT EXISTS (
      SELECT 1 FROM members m
      WHERE m.room_id = members.room_id
    )
  );

CREATE POLICY "members_insert_contributor" ON members
  FOR INSERT WITH CHECK (
    role = 'contributor'
    AND EXISTS (
      SELECT 1 FROM invite_tokens t
      WHERE t.room_id = members.room_id
        AND t.revoked = false
    )
  );

-- Member can update their own row only
CREATE POLICY "members_update_own" ON members
  FOR UPDATE USING (
    device_token = current_setting('request.headers', true)::json->>'x-device-token'
  );

-- Owner can delete any member from their room; member can delete themselves
CREATE POLICY "members_delete_owner_or_self" ON members
  FOR DELETE USING (
    device_token = current_setting('request.headers', true)::json->>'x-device-token'
    OR is_room_owner(room_id, current_setting('request.headers', true)::json->>'x-device-token')
  );

-- ============================================================
-- MEMORIES policies
-- ============================================================
CREATE POLICY "memories_select_member" ON memories
  FOR SELECT USING (
    is_room_member(room_id, current_setting('request.headers', true)::json->>'x-device-token')
  );

CREATE POLICY "memories_insert_member" ON memories
  FOR INSERT WITH CHECK (
    is_room_member(room_id, current_setting('request.headers', true)::json->>'x-device-token')
  );

CREATE POLICY "memories_update_creator_or_owner" ON memories
  FOR UPDATE USING (
    created_by = get_member_id(room_id, current_setting('request.headers', true)::json->>'x-device-token')
    OR is_room_owner(room_id, current_setting('request.headers', true)::json->>'x-device-token')
  );

CREATE POLICY "memories_delete_creator_or_owner" ON memories
  FOR DELETE USING (
    created_by = get_member_id(room_id, current_setting('request.headers', true)::json->>'x-device-token')
    OR is_room_owner(room_id, current_setting('request.headers', true)::json->>'x-device-token')
  );

-- ============================================================
-- MEMORY PHOTOS policies (inherit via memory)
-- ============================================================
CREATE POLICY "memory_photos_select" ON memory_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memories m
      WHERE m.id = memory_id
        AND is_room_member(m.room_id, current_setting('request.headers', true)::json->>'x-device-token')
    )
  );

CREATE POLICY "memory_photos_insert" ON memory_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memories m
      WHERE m.id = memory_id
        AND is_room_member(m.room_id, current_setting('request.headers', true)::json->>'x-device-token')
    )
  );

CREATE POLICY "memory_photos_delete" ON memory_photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM memories m
      WHERE m.id = memory_id
        AND (
          m.created_by = get_member_id(m.room_id, current_setting('request.headers', true)::json->>'x-device-token')
          OR is_room_owner(m.room_id, current_setting('request.headers', true)::json->>'x-device-token')
        )
    )
  );

-- ============================================================
-- MEMORY PEOPLE
-- ============================================================
CREATE POLICY "memory_people_select" ON memory_people
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memories m WHERE m.id = memory_id
        AND is_room_member(m.room_id, current_setting('request.headers', true)::json->>'x-device-token')
    )
  );

CREATE POLICY "memory_people_insert" ON memory_people
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memories m WHERE m.id = memory_id
        AND is_room_member(m.room_id, current_setting('request.headers', true)::json->>'x-device-token')
    )
  );

CREATE POLICY "memory_people_delete" ON memory_people
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM memories m WHERE m.id = memory_id
        AND (
          m.created_by = get_member_id(m.room_id, current_setting('request.headers', true)::json->>'x-device-token')
          OR is_room_owner(m.room_id, current_setting('request.headers', true)::json->>'x-device-token')
        )
    )
  );

-- ============================================================
-- ALBUMS
-- ============================================================
CREATE POLICY "albums_select" ON albums FOR SELECT USING (
  is_room_member(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);
CREATE POLICY "albums_insert" ON albums FOR INSERT WITH CHECK (
  is_room_member(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);
CREATE POLICY "albums_delete" ON albums FOR DELETE USING (
  is_room_owner(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);

-- ============================================================
-- ALBUM MEMORIES
-- ============================================================
CREATE POLICY "album_memories_select" ON album_memories FOR SELECT USING (
  EXISTS (SELECT 1 FROM albums a WHERE a.id = album_id
    AND is_room_member(a.room_id, current_setting('request.headers', true)::json->>'x-device-token'))
);
CREATE POLICY "album_memories_insert" ON album_memories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM albums a WHERE a.id = album_id
    AND is_room_member(a.room_id, current_setting('request.headers', true)::json->>'x-device-token'))
);
CREATE POLICY "album_memories_delete" ON album_memories FOR DELETE USING (
  EXISTS (SELECT 1 FROM albums a WHERE a.id = album_id
    AND is_room_member(a.room_id, current_setting('request.headers', true)::json->>'x-device-token'))
);

-- ============================================================
-- STORIES
-- ============================================================
CREATE POLICY "stories_select" ON stories FOR SELECT USING (
  is_room_member(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);
CREATE POLICY "stories_insert" ON stories FOR INSERT WITH CHECK (
  is_room_member(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);
CREATE POLICY "stories_update" ON stories FOR UPDATE USING (
  created_by = get_member_id(room_id, current_setting('request.headers', true)::json->>'x-device-token')
  OR is_room_owner(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);
CREATE POLICY "stories_delete" ON stories FOR DELETE USING (
  created_by = get_member_id(room_id, current_setting('request.headers', true)::json->>'x-device-token')
  OR is_room_owner(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);

-- ============================================================
-- PLANS
-- ============================================================
CREATE POLICY "plans_select" ON plans FOR SELECT USING (
  is_room_member(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);
CREATE POLICY "plans_insert" ON plans FOR INSERT WITH CHECK (
  is_room_member(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);
CREATE POLICY "plans_update" ON plans FOR UPDATE USING (
  created_by = get_member_id(room_id, current_setting('request.headers', true)::json->>'x-device-token')
  OR is_room_owner(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);
CREATE POLICY "plans_delete" ON plans FOR DELETE USING (
  created_by = get_member_id(room_id, current_setting('request.headers', true)::json->>'x-device-token')
  OR is_room_owner(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);

-- ============================================================
-- PLAN PARTICIPANTS
-- ============================================================
CREATE POLICY "plan_participants_select" ON plan_participants FOR SELECT USING (
  EXISTS (SELECT 1 FROM plans p WHERE p.id = plan_id
    AND is_room_member(p.room_id, current_setting('request.headers', true)::json->>'x-device-token'))
);
CREATE POLICY "plan_participants_insert" ON plan_participants FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM plans p WHERE p.id = plan_id
    AND is_room_member(p.room_id, current_setting('request.headers', true)::json->>'x-device-token'))
);
CREATE POLICY "plan_participants_delete" ON plan_participants FOR DELETE USING (
  EXISTS (SELECT 1 FROM plans p WHERE p.id = plan_id
    AND is_room_member(p.room_id, current_setting('request.headers', true)::json->>'x-device-token'))
);

-- ============================================================
-- QUOTES & LIKES
-- ============================================================
CREATE POLICY "quotes_select" ON quotes FOR SELECT USING (
  is_room_member(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);
CREATE POLICY "quotes_insert" ON quotes FOR INSERT WITH CHECK (
  is_room_member(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);
CREATE POLICY "quotes_delete" ON quotes FOR DELETE USING (
  created_by = get_member_id(room_id, current_setting('request.headers', true)::json->>'x-device-token')
  OR is_room_owner(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);

CREATE POLICY "quote_likes_select" ON quote_likes FOR SELECT USING (
  EXISTS (SELECT 1 FROM quotes q WHERE q.id = quote_id
    AND is_room_member(q.room_id, current_setting('request.headers', true)::json->>'x-device-token'))
);
CREATE POLICY "quote_likes_insert" ON quote_likes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM quotes q WHERE q.id = quote_id
    AND is_room_member(q.room_id, current_setting('request.headers', true)::json->>'x-device-token'))
);
CREATE POLICY "quote_likes_delete" ON quote_likes FOR DELETE USING (
  member_id = get_member_id(
    (SELECT room_id FROM quotes WHERE id = quote_id),
    current_setting('request.headers', true)::json->>'x-device-token'
  )
);

-- ============================================================
-- LITTLE THINGS
-- ============================================================
CREATE POLICY "little_things_select" ON little_things FOR SELECT USING (
  is_room_member(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);
CREATE POLICY "little_things_insert" ON little_things FOR INSERT WITH CHECK (
  is_room_member(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);
CREATE POLICY "little_things_delete" ON little_things FOR DELETE USING (
  created_by = get_member_id(room_id, current_setting('request.headers', true)::json->>'x-device-token')
  OR is_room_owner(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);

-- ============================================================
-- IMPORTANT DATES
-- ============================================================
CREATE POLICY "important_dates_select" ON important_dates FOR SELECT USING (
  is_room_member(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);
CREATE POLICY "important_dates_insert" ON important_dates FOR INSERT WITH CHECK (
  is_room_member(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);
CREATE POLICY "important_dates_delete" ON important_dates FOR DELETE USING (
  created_by = get_member_id(room_id, current_setting('request.headers', true)::json->>'x-device-token')
  OR is_room_owner(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);

-- ============================================================
-- REACTIONS (realtime)
-- ============================================================
CREATE POLICY "reactions_select" ON reactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM memories m WHERE m.id = memory_id
    AND is_room_member(m.room_id, current_setting('request.headers', true)::json->>'x-device-token'))
);
CREATE POLICY "reactions_insert" ON reactions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM memories m WHERE m.id = memory_id
    AND is_room_member(m.room_id, current_setting('request.headers', true)::json->>'x-device-token'))
);
CREATE POLICY "reactions_delete" ON reactions FOR DELETE USING (
  member_id = get_member_id(
    (SELECT room_id FROM memories WHERE id = memory_id),
    current_setting('request.headers', true)::json->>'x-device-token'
  )
);

-- ============================================================
-- COMMENTS (realtime)
-- ============================================================
CREATE POLICY "comments_select" ON comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM memories m WHERE m.id = memory_id
    AND is_room_member(m.room_id, current_setting('request.headers', true)::json->>'x-device-token'))
);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM memories m WHERE m.id = memory_id
    AND is_room_member(m.room_id, current_setting('request.headers', true)::json->>'x-device-token'))
);
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (
  member_id = get_member_id(
    (SELECT room_id FROM memories WHERE id = memory_id),
    current_setting('request.headers', true)::json->>'x-device-token'
  )
  OR EXISTS (
    SELECT 1 FROM memories m WHERE m.id = memory_id
      AND is_room_owner(m.room_id, current_setting('request.headers', true)::json->>'x-device-token')
  )
);

-- Only room members can list invite tokens, or anon can query active (non-revoked) tokens
CREATE POLICY "invite_tokens_select" ON invite_tokens FOR SELECT USING (
  is_room_member(room_id, current_setting('request.headers', true)::json->>'x-device-token')
  OR revoked = false
);

CREATE POLICY "invite_tokens_insert" ON invite_tokens FOR INSERT WITH CHECK (
  is_room_member(room_id, current_setting('request.headers', true)::json->>'x-device-token')
  OR NOT EXISTS (
    SELECT 1 FROM invite_tokens t
    WHERE t.room_id = invite_tokens.room_id
  )
);

CREATE POLICY "invite_tokens_update_revoke" ON invite_tokens FOR UPDATE USING (
  is_room_owner(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);

-- ============================================================
-- MUSIC TRACKS
-- ============================================================
CREATE POLICY "music_tracks_select" ON music_tracks FOR SELECT USING (
  is_room_member(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);
CREATE POLICY "music_tracks_insert" ON music_tracks FOR INSERT WITH CHECK (
  is_room_member(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);
CREATE POLICY "music_tracks_delete" ON music_tracks FOR DELETE USING (
  created_by = get_member_id(room_id, current_setting('request.headers', true)::json->>'x-device-token')
  OR is_room_owner(room_id, current_setting('request.headers', true)::json->>'x-device-token')
);

-- ============================================================
-- ATOMIC RPC FUNCTIONS (SECURITY DEFINER)
-- ============================================================

-- Validate an invite token safely without exposing table rows
CREATE OR REPLACE FUNCTION validate_room_invite(p_room_id UUID, p_token TEXT)
RETURNS TABLE (
  valid BOOLEAN,
  room_id UUID,
  room_name TEXT
) AS $$
  SELECT
    true AS valid,
    r.id AS room_id,
    r.name AS room_name
  FROM invite_tokens t
  JOIN rooms r ON r.id = t.room_id
  WHERE t.room_id = p_room_id
    AND t.token = p_token
    AND t.revoked = false
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Atomic room creation: creates room, member, sets owner_id, and creates first token in 1 tx
CREATE OR REPLACE FUNCTION create_room_with_owner(
  p_room_name TEXT,
  p_owner_name TEXT,
  p_avatar_url TEXT,
  p_device_token TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_room rooms%ROWTYPE;
  v_member members%ROWTYPE;
  v_token invite_tokens%ROWTYPE;
BEGIN
  -- 1. Insert room
  INSERT INTO rooms (name) VALUES (p_room_name) RETURNING * INTO v_room;

  -- 2. Insert owner member
  INSERT INTO members (room_id, name, avatar_url, role, device_token)
  VALUES (v_room.id, p_owner_name, p_avatar_url, 'owner', p_device_token)
  RETURNING * INTO v_member;

  -- 3. Update room owner_id
  UPDATE rooms SET owner_id = v_member.id WHERE id = v_room.id;
  v_room.owner_id := v_member.id;

  -- 4. Create initial invite token
  INSERT INTO invite_tokens (room_id, created_by)
  VALUES (v_room.id, v_member.id)
  RETURNING * INTO v_token;

  RETURN jsonb_build_object(
    'member', to_jsonb(v_member),
    'room', to_jsonb(v_room),
    'invite_token', v_token.token
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic join: validates token and inserts contributor member in 1 tx
CREATE OR REPLACE FUNCTION join_room_with_invite(
  p_room_id UUID,
  p_invite_token TEXT,
  p_name TEXT,
  p_avatar_url TEXT,
  p_device_token TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_room rooms%ROWTYPE;
  v_member members%ROWTYPE;
  v_token_id UUID;
BEGIN
  -- 1. Validate invite token
  SELECT id INTO v_token_id
  FROM invite_tokens
  WHERE room_id = p_room_id
    AND token = p_invite_token
    AND revoked = false
  LIMIT 1;

  IF v_token_id IS NULL THEN
    RAISE EXCEPTION 'Link undangan tidak valid atau sudah kadaluarsa.';
  END IF;

  -- 2. Verify room exists
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id;
  IF v_room.id IS NULL THEN
    RAISE EXCEPTION 'Room tidak ditemukan.';
  END IF;

  -- 3. Insert new member as contributor
  INSERT INTO members (room_id, name, avatar_url, role, device_token)
  VALUES (p_room_id, p_name, p_avatar_url, 'contributor', p_device_token)
  RETURNING * INTO v_member;

  RETURN jsonb_build_object(
    'member', to_jsonb(v_member),
    'room', to_jsonb(v_room)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


