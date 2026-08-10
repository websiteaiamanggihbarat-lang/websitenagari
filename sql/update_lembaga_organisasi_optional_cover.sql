-- ============================================================================
-- SCRIPT MIGRASI: LEMBAGA DAN ORGANISASI COVER OPSIONAL & DEFAULTS
-- File: sql/update_lembaga_organisasi_optional_cover.sql
-- Keterangan: Hapus trigger validasi activation wajib cover dan ubah default
--             `is_active` menjadi `true` agar record lembaga tanpa cover
--             dapat disimpan & langsung aktif secara publik.
-- ============================================================================

begin;

-- 1. Hapus Trigger & Function Validasi Activation Wajib Cover
drop trigger if exists trg_lembaga_organisasi_validate_activation on public.lembaga_organisasi;
drop function if exists public.validate_lembaga_organisasi_activation();

-- 2. Hapus Trigger & Function Auto-Deactivate Parent Tanpa Cover
drop trigger if exists trg_galeri_lembaga_organisasi_deactivate_parent_without_cover on public.galeri_lembaga_organisasi;
drop function if exists public.deactivate_lembaga_organisasi_without_cover();

-- 3. Ubah Default Column `is_active` Menjadi TRUE
alter table public.lembaga_organisasi
  alter column is_active set default true;

-- 4. Aktifkan Seluruh Record Existing (jika ada record draft lama)
update public.lembaga_organisasi
  set is_active = true
  where is_active = false;

commit;
