-- =============================================================================
-- MIGRATION: Penambahan Kolom jenis_kesenian dan jenis_slug
-- Tabel: public.kesenian_tradisional
-- Tanggal: 2026-07-29
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PEMERIKSAAN AWAL
-- -----------------------------------------------------------------------------
-- Jalankan query berikut untuk memeriksa data dan struktur tabel saat ini:
/*
SELECT id, nama_kesenian, kategori, is_active 
FROM public.kesenian_tradisional
ORDER BY urutan ASC, nama_kesenian ASC;
*/

-- -----------------------------------------------------------------------------
-- 2. PENAMBAHAN KOLOM jenis_kesenian DAN jenis_slug (NULLABLE)
-- -----------------------------------------------------------------------------
ALTER TABLE public.kesenian_tradisional
ADD COLUMN IF NOT EXISTS jenis_kesenian text,
ADD COLUMN IF NOT EXISTS jenis_slug text;

-- -----------------------------------------------------------------------------
-- 3. COMMENT DOKUMENTASI KOLOM
-- -----------------------------------------------------------------------------
COMMENT ON COLUMN public.kesenian_tradisional.jenis_kesenian IS 'Nama jenis spesifik kesenian tradisional (contoh: Randai, Tari, Rebana, Ronggeng, Deki Pano)';
COMMENT ON COLUMN public.kesenian_tradisional.jenis_slug IS 'Slug identitas filter URL (contoh: randai, tari, rebana, ronggeng, deki-pano)';

-- -----------------------------------------------------------------------------
-- 4. CHECK CONSTRAINT
-- -----------------------------------------------------------------------------
-- Aturan constraint (chk_kesenian_jenis_valid):
-- a. jenis_kesenian dan jenis_slug harus sama-sama NULL atau sama-sama TERISI.
-- b. Jika terisi, jenis_kesenian tidak boleh kosong setelah trim.
-- c. Jika terisi, jenis_slug hanya menerima pola: ^[a-z0-9]+(-[a-z0-9]+)*$
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_kesenian_jenis_valid'
    ) THEN
        ALTER TABLE public.kesenian_tradisional
        ADD CONSTRAINT chk_kesenian_jenis_valid
        CHECK (
            (jenis_kesenian IS NULL AND jenis_slug IS NULL)
            OR (
                jenis_kesenian IS NOT NULL 
                AND jenis_slug IS NOT NULL 
                AND length(trim(jenis_kesenian)) > 0 
                AND jenis_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
            )
        );
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 5. PARTIAL INDEX UNTUK QUERY PUBLIK
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_kesenian_jenis_publik
ON public.kesenian_tradisional (jenis_slug, urutan, nama_kesenian)
WHERE is_active = true AND jenis_slug IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 6. QUERY VERIFIKASI KOLOM, CONSTRAINT, INDEX, DAN DATA LAMA
-- -----------------------------------------------------------------------------
/*
-- Verifikasi Struktur Kolom:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'kesenian_tradisional'
  AND column_name IN ('jenis_kesenian', 'jenis_slug');

-- Verifikasi Check Constraint:
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.kesenian_tradisional'::regclass
  AND conname = 'chk_kesenian_jenis_valid';

-- Verifikasi Index:
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'kesenian_tradisional'
  AND indexname = 'idx_kesenian_jenis_publik';
*/

-- -----------------------------------------------------------------------------
-- 7. QUERY PEMERIKSAAN DATA YANG BELUM LENGKAP
-- -----------------------------------------------------------------------------
/*
-- Jalankan query ini untuk melihat record data mana saja yang belum dilengkapi jenisnya:
SELECT id, nama_kesenian, kategori, jenis_kesenian, jenis_slug, is_active
FROM public.kesenian_tradisional
WHERE jenis_kesenian IS NULL OR jenis_slug IS NULL;
*/

-- -----------------------------------------------------------------------------
-- 8. PENETAPAN NOT NULL (SECTION TERPISAH)
-- CATATAN PENTING:
-- Bagian ini HANYA Boleh dijalankan SETELAH SELURUH DATA LAMA diisi/dilengkapi!
-- -----------------------------------------------------------------------------
/*
-- Langkah 1: Pastikan query pada Section 7 mengembalikan 0 baris (seluruh data terisi).
-- Langkah 2: Buka komentar dan jalankan pernyataan di bawah ini untuk mengunci kolom:

ALTER TABLE public.kesenian_tradisional
ALTER COLUMN jenis_kesenian SET NOT NULL,
ALTER COLUMN jenis_slug SET NOT NULL;
*/
