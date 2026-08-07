-- =====================================================
-- MIGRATION: BIAYA LAYANAN SURAT
-- SCRIPT: sql/add_biaya_layanan_surat.sql
-- TARGET DB: Supabase Development & Production
-- PATTERN: FAIL-CLOSED TRANSACTION (STRICT IDEMPOTENT BY REJECTION)
-- =====================================================

begin;

-- 1. TAMBAH KOLOM BIAYA TERSTRUKTUR PADA LAYANAN SURAT
alter table public.layanan_surat
  add column biaya text not null default 'Gratis';

-- 2. BATASI AGAR BIAYA TIDAK BOLEH STRING KOSONG
alter table public.layanan_surat
  add constraint ck_layanan_surat_biaya_tidak_kosong
  check (char_length(btrim(biaya)) >= 1);

-- 3. DOKUMENTASI KOLOM
comment on column public.layanan_surat.biaya is 'Informasi biaya layanan yang ditampilkan kepada masyarakat, misalnya Gratis atau Rp10.000.';

commit;
