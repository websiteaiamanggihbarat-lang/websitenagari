-- ============================================================================
-- SCRIPT MIGRASI FINAL: HERO / BANNER UTAMA BERANDA DINAMIS
-- File: sql/create_hero_beranda.sql
-- Keterangan: Pembuatan skema database, constraint, index, trigger, RLS, policy
--             tabel, dan policy Storage untuk fitur Hero Beranda Dinamis.
-- ============================================================================

-- ============================================================================
-- SECTION 01: PEMERIKSAAN AWAL (READ-ONLY)
-- ============================================================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'hero_beranda';

-- ============================================================================
-- SECTION 02: PEMBUATAN TABEL PUBLIC.HERO_BERANDA
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.hero_beranda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_internal text NOT NULL,
  gambar_url text NOT NULL,
  gambar_storage_path text NOT NULL,
  teks_alt text NOT NULL,
  posisi_gambar text NOT NULL DEFAULT 'center',
  is_active boolean NOT NULL DEFAULT false,
  urutan integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.hero_beranda IS 'Tabel penyimpanan gambar latar belakang slider hero/banner beranda dinamis';
COMMENT ON COLUMN public.hero_beranda.nama_internal IS 'Nama pengenal gambar khusus untuk dashboard admin';
COMMENT ON COLUMN public.hero_beranda.gambar_url IS 'URL publik HTTPS file gambar di Supabase Storage';
COMMENT ON COLUMN public.hero_beranda.gambar_storage_path IS 'Path internal file pada bucket gambar-hero-beranda';
COMMENT ON COLUMN public.hero_beranda.teks_alt IS 'Teks alternatif untuk aksesibilitas pembaca layar (screen reader)';
COMMENT ON COLUMN public.hero_beranda.posisi_gambar IS 'Nilai posisi fokus object-position CSS (center, top, bottom, left, right)';
COMMENT ON COLUMN public.hero_beranda.is_active IS 'Status publikasi gambar (true = tampil di beranda)';
COMMENT ON COLUMN public.hero_beranda.urutan IS 'Urutan tampilan slider gambar di beranda (minimal 0)';

-- ============================================================================
-- SECTION 03: CONSTRAINT DAN UNIQUE
-- ============================================================================
-- 1. Check Constraint Nama Internal tidak boleh kosong setelah trim
ALTER TABLE public.hero_beranda
  DROP CONSTRAINT IF EXISTS chk_hero_nama_internal_not_empty;

ALTER TABLE public.hero_beranda
  ADD CONSTRAINT chk_hero_nama_internal_not_empty
  CHECK (btrim(nama_internal) <> '');

-- 2. Check Constraint Gambar URL wajib HTTPS
ALTER TABLE public.hero_beranda
  DROP CONSTRAINT IF EXISTS chk_hero_gambar_url_https;

ALTER TABLE public.hero_beranda
  ADD CONSTRAINT chk_hero_gambar_url_https
  CHECK (gambar_url ~* '^https://');

-- 3. Check Constraint Storage Path tidak boleh kosong setelah trim
ALTER TABLE public.hero_beranda
  DROP CONSTRAINT IF EXISTS chk_hero_gambar_path_not_empty;

ALTER TABLE public.hero_beranda
  ADD CONSTRAINT chk_hero_gambar_path_not_empty
  CHECK (btrim(gambar_storage_path) <> '');

-- 4. Check Constraint Teks Alternatif tidak boleh kosong setelah trim
ALTER TABLE public.hero_beranda
  DROP CONSTRAINT IF EXISTS chk_hero_teks_alt_not_empty;

ALTER TABLE public.hero_beranda
  ADD CONSTRAINT chk_hero_teks_alt_not_empty
  CHECK (btrim(teks_alt) <> '');

-- 5. Check Constraint Posisi Gambar Valid
ALTER TABLE public.hero_beranda
  DROP CONSTRAINT IF EXISTS chk_hero_posisi_gambar_valid;

ALTER TABLE public.hero_beranda
  ADD CONSTRAINT chk_hero_posisi_gambar_valid
  CHECK (posisi_gambar IN ('center', 'top', 'bottom', 'left', 'right'));

-- 6. Check Constraint Urutan Minimal Nol
ALTER TABLE public.hero_beranda
  DROP CONSTRAINT IF EXISTS chk_hero_urutan_min_zero;

ALTER TABLE public.hero_beranda
  ADD CONSTRAINT chk_hero_urutan_min_zero
  CHECK (urutan >= 0);

-- 7. Unique Constraint Storage Path
ALTER TABLE public.hero_beranda
  DROP CONSTRAINT IF EXISTS uq_hero_gambar_storage_path;

ALTER TABLE public.hero_beranda
  ADD CONSTRAINT uq_hero_gambar_storage_path
  UNIQUE (gambar_storage_path);

-- ============================================================================
-- SECTION 04: INDEX DETERMINISTIK
-- ============================================================================
-- Index Publik (Deterministik dengan Tie-Breaker created_at & id)
DROP INDEX IF EXISTS public.idx_hero_beranda_publik;
CREATE INDEX idx_hero_beranda_publik ON public.hero_beranda (
  urutan ASC,
  created_at ASC,
  id ASC
) WHERE is_active = true;

-- Index Admin Filter & Sorting
DROP INDEX IF EXISTS public.idx_hero_beranda_admin;
CREATE INDEX idx_hero_beranda_admin ON public.hero_beranda (
  urutan ASC,
  created_at ASC,
  id ASC
);

-- ============================================================================
-- SECTION 05: FUNGSI DAN TRIGGER UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at_hero_beranda()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hero_beranda_updated_at ON public.hero_beranda;
CREATE TRIGGER trg_hero_beranda_updated_at
  BEFORE UPDATE ON public.hero_beranda
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_hero_beranda();

-- ============================================================================
-- SECTION 06: RLS DAN GRANTS TABEL
-- ============================================================================
ALTER TABLE public.hero_beranda ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.hero_beranda FROM anon, authenticated;

GRANT SELECT ON TABLE public.hero_beranda TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hero_beranda TO authenticated;

-- ============================================================================
-- SECTION 07: POLICY TABEL PUBLIC.HERO_BERANDA
-- ============================================================================
DROP POLICY IF EXISTS hero_beranda_table_anon_select ON public.hero_beranda;
CREATE POLICY hero_beranda_table_anon_select ON public.hero_beranda
  FOR SELECT TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS hero_beranda_table_authenticated_select ON public.hero_beranda;
CREATE POLICY hero_beranda_table_authenticated_select ON public.hero_beranda
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS hero_beranda_table_authenticated_insert ON public.hero_beranda;
CREATE POLICY hero_beranda_table_authenticated_insert ON public.hero_beranda
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS hero_beranda_table_authenticated_update ON public.hero_beranda;
CREATE POLICY hero_beranda_table_authenticated_update ON public.hero_beranda
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS hero_beranda_table_authenticated_delete ON public.hero_beranda;
CREATE POLICY hero_beranda_table_authenticated_delete ON public.hero_beranda
  FOR DELETE TO authenticated
  USING (true);

-- ============================================================================
-- SECTION 08: KONFIGURASI BUCKET STORAGE (DIBUAT VIA DASHBOARD SUPABASE)
-- ============================================================================
-- Bucket Name: gambar-hero-beranda
-- Public Bucket: true
-- Max File Size Limit: 10485760 (10 MB)
-- Allowed MIME Types: image/jpeg, image/png, image/webp
-- Format Path File: hero-beranda/{heroId}/gambar/{timestamp}-{randomSuffix}-{namaFileAman}

-- ============================================================================
-- SECTION 09: QUERY VERIFIKASI STORAGE.FOLDERNAME
-- ============================================================================
SELECT
  storage.foldername('hero-beranda/11111111-1111-4111-8111-111111111111/gambar/foto-hero.jpeg') AS folder_array,
  (storage.foldername('hero-beranda/11111111-1111-4111-8111-111111111111/gambar/foto-hero.jpeg'))[1] AS folder_1,
  (storage.foldername('hero-beranda/11111111-1111-4111-8111-111111111111/gambar/foto-hero.jpeg'))[2] AS folder_2_uuid,
  (storage.foldername('hero-beranda/11111111-1111-4111-8111-111111111111/gambar/foto-hero.jpeg'))[3] AS folder_3;

-- ============================================================================
-- SECTION 10: POLICY STORAGE.OBJECTS (BUCKET GAMBAR-HERO-BERANDA)
-- ============================================================================
DROP POLICY IF EXISTS hero_beranda_storage_authenticated_select ON storage.objects;
CREATE POLICY hero_beranda_storage_authenticated_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'gambar-hero-beranda' AND
    (storage.foldername(name))[1] = 'hero-beranda' AND
    (storage.foldername(name))[3] = 'gambar'
  );

DROP POLICY IF EXISTS hero_beranda_storage_authenticated_insert ON storage.objects;
CREATE POLICY hero_beranda_storage_authenticated_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'gambar-hero-beranda' AND
    (storage.foldername(name))[1] = 'hero-beranda' AND
    (storage.foldername(name))[3] = 'gambar'
  );

DROP POLICY IF EXISTS hero_beranda_storage_authenticated_update ON storage.objects;
CREATE POLICY hero_beranda_storage_authenticated_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'gambar-hero-beranda' AND
    (storage.foldername(name))[1] = 'hero-beranda' AND
    (storage.foldername(name))[3] = 'gambar'
  )
  WITH CHECK (
    bucket_id = 'gambar-hero-beranda' AND
    (storage.foldername(name))[1] = 'hero-beranda' AND
    (storage.foldername(name))[3] = 'gambar'
  );

DROP POLICY IF EXISTS hero_beranda_storage_authenticated_delete ON storage.objects;
CREATE POLICY hero_beranda_storage_authenticated_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'gambar-hero-beranda' AND
    (storage.foldername(name))[1] = 'hero-beranda' AND
    (storage.foldername(name))[3] = 'gambar'
  );

-- ============================================================================
-- SECTION 11: VERIFIKASI AKHIR SKEMA DATABASE & POLICIES
-- ============================================================================
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'hero_beranda'
ORDER BY ordinal_position;

SELECT policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'hero_beranda' OR (tablename = 'objects' AND policyname LIKE 'hero_beranda%');

-- ============================================================================
-- SECTION 12: UJI TRANSAKSI (DIBUNGKUS ROLLBACK - TIDAK MUTASI DATABASE)
-- ============================================================================
BEGIN;

INSERT INTO public.hero_beranda (
  id,
  nama_internal,
  gambar_url,
  gambar_storage_path,
  teks_alt,
  posisi_gambar,
  is_active,
  urutan
) VALUES (
  '99999999-9999-4999-8999-999999999999',
  'Uji Transaksi Hero',
  'https://lqhckzkctodywnnwrxcj.supabase.co/storage/v1/object/public/gambar-hero-beranda/hero-beranda/99999999-9999-4999-8999-999999999999/gambar/test.jpeg',
  'hero-beranda/99999999-9999-4999-8999-999999999999/gambar/test.jpeg',
  'Teks alt uji transaksi',
  'center',
  true,
  0
);

SELECT id, nama_internal, gambar_url, posisi_gambar, is_active 
FROM public.hero_beranda 
WHERE id = '99999999-9999-4999-8999-999999999999';

ROLLBACK;
