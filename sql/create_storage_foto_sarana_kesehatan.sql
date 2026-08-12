-- ============================================================================
-- SQL SCRIPT: POLICIES SUPABASE STORAGE UNTUK BUCKET FOTO SARANA KESEHATAN
-- BUCKET NAME: foto-sarana-kesehatan
-- ============================================================================

-- 1. Inisialisasi Bucket 'foto-sarana-kesehatan' (jika belum ada, buat sebagai public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'foto-sarana-kesehatan',
  'foto-sarana-kesehatan',
  true,
  2097152, -- Maksimal 2 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- 2. Policy SELECT untuk Public (Pengunjung Website)
-- Memungkinkan siapapun membaca foto sarana kesehatan publik
DROP POLICY IF EXISTS foto_sarana_kesehatan_public_select ON storage.objects;
CREATE POLICY foto_sarana_kesehatan_public_select ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'foto-sarana-kesehatan');

-- 3. Policy SELECT untuk Authenticated Admin
-- Memungkinkan Admin yang terautentikasi membaca metadata foto
DROP POLICY IF EXISTS foto_sarana_kesehatan_authenticated_select ON storage.objects;
CREATE POLICY foto_sarana_kesehatan_authenticated_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'foto-sarana-kesehatan');

-- 4. Policy INSERT untuk Authenticated Admin
-- Memungkinkan Admin mengunggah foto baru ke bucket foto-sarana-kesehatan
DROP POLICY IF EXISTS foto_sarana_kesehatan_authenticated_insert ON storage.objects;
CREATE POLICY foto_sarana_kesehatan_authenticated_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'foto-sarana-kesehatan');

-- 5. Policy UPDATE untuk Authenticated Admin
-- Memungkinkan Admin memperbarui/mengganti foto existing
DROP POLICY IF EXISTS foto_sarana_kesehatan_authenticated_update ON storage.objects;
CREATE POLICY foto_sarana_kesehatan_authenticated_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'foto-sarana-kesehatan')
  WITH CHECK (bucket_id = 'foto-sarana-kesehatan');

-- 6. Policy DELETE untuk Authenticated Admin
-- Memungkinkan Admin menghapus foto lama dari Storage
DROP POLICY IF EXISTS foto_sarana_kesehatan_authenticated_delete ON storage.objects;
CREATE POLICY foto_sarana_kesehatan_authenticated_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'foto-sarana-kesehatan');
