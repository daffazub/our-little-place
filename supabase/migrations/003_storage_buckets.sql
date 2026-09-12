-- ============================================================
-- Our Little Place v2 — Migration 003: Storage Buckets
-- Run AFTER 002_rls_policies.sql
-- ============================================================

-- Helper function to safely cast text to UUID without crashing on malformed input
CREATE OR REPLACE FUNCTION safe_cast_uuid(val TEXT)
RETURNS UUID AS $$
BEGIN
  RETURN val::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('photos', 'photos', true,  5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('videos', 'videos', true,  52428800, ARRAY['video/mp4','video/webm','video/quicktime']),
  ('music',  'music',  false, 10485760, ARRAY['audio/mpeg','audio/mp4','audio/ogg','audio/wav'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Storage RLS: photos bucket
-- ============================================================
CREATE POLICY "photos_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "photos_insert_member" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'photos'
    AND auth.role() = 'anon'
    -- path format: {room_id}/{memory_id}/{filename}
    -- validate room membership via device_token header safely
    AND EXISTS (
      SELECT 1 FROM members
      WHERE room_id = safe_cast_uuid((storage.foldername(name))[1])
        AND device_token = current_setting('request.headers', true)::json->>'x-device-token'
    )
  );

CREATE POLICY "photos_delete_member" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'photos'
    AND EXISTS (
      SELECT 1 FROM members
      WHERE room_id = safe_cast_uuid((storage.foldername(name))[1])
        AND device_token = current_setting('request.headers', true)::json->>'x-device-token'
    )
  );

-- ============================================================
-- Storage RLS: videos bucket
-- ============================================================
CREATE POLICY "videos_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "videos_insert_member" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'videos'
    AND EXISTS (
      SELECT 1 FROM members
      WHERE room_id = safe_cast_uuid((storage.foldername(name))[1])
        AND device_token = current_setting('request.headers', true)::json->>'x-device-token'
    )
  );

CREATE POLICY "videos_delete_member" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'videos'
    AND EXISTS (
      SELECT 1 FROM members
      WHERE room_id = safe_cast_uuid((storage.foldername(name))[1])
        AND device_token = current_setting('request.headers', true)::json->>'x-device-token'
    )
  );

-- ============================================================
-- Storage RLS: music bucket (private — anon can't read directly)
-- ============================================================
CREATE POLICY "music_select_member" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'music'
    AND EXISTS (
      SELECT 1 FROM members
      WHERE room_id = safe_cast_uuid((storage.foldername(name))[1])
        AND device_token = current_setting('request.headers', true)::json->>'x-device-token'
    )
  );

CREATE POLICY "music_insert_member" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'music'
    AND EXISTS (
      SELECT 1 FROM members
      WHERE room_id = safe_cast_uuid((storage.foldername(name))[1])
        AND device_token = current_setting('request.headers', true)::json->>'x-device-token'
    )
  );

CREATE POLICY "music_delete_member" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'music'
    AND EXISTS (
      SELECT 1 FROM members
      WHERE room_id = safe_cast_uuid((storage.foldername(name))[1])
        AND device_token = current_setting('request.headers', true)::json->>'x-device-token'
    )
  );
