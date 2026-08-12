-- ============================================================================
-- SCRIPT MIGRASI: KELOMPOK TANI DAN BUMNAG COVER OPSIONAL & DEFAULTS
-- File: sql/update_kelompok_tani_bumnag_optional_cover.sql
-- Keterangan: Hapus trigger/constraint validasi activation wajib cover dan ubah default
--             `is_active` menjadi `true` agar record entitas tanpa cover
--             dapat disimpan & langsung aktif secara publik.
-- ============================================================================

begin;

-- 1. Hapus Trigger & Function Validasi Activation Wajib Cover (trg_check_kelompok_tani_bumnag_activation)
drop trigger if exists trg_check_kelompok_tani_bumnag_activation on public.kelompok_tani_bumnag;
drop function if exists public.check_kelompok_tani_bumnag_activation();

-- 2. Hapus Alternative Trigger & Function Validasi Activation Wajib Cover (jika ada)
drop trigger if exists trg_kelompok_tani_bumnag_validate_activation on public.kelompok_tani_bumnag;
drop function if exists public.validate_kelompok_tani_bumnag_activation();

-- 3. Hapus Trigger & Function Auto-Deactivate Parent Tanpa Cover (jika ada)
drop trigger if exists trg_galeri_kelompok_tani_bumnag_deactivate_parent_without_cover on public.galeri_kelompok_tani_bumnag;
drop function if exists public.deactivate_kelompok_tani_bumnag_without_cover();

-- 4. Hapus Potential Check Constraints Wajib Cover (jika ada)
alter table public.kelompok_tani_bumnag drop constraint if exists chk_kelompok_tani_bumnag_cover_required;
alter table public.kelompok_tani_bumnag drop constraint if exists chk_kelompok_tani_bumnag_active_requires_cover;
alter table public.kelompok_tani_bumnag drop constraint if exists chk_kelompok_tani_bumnag_has_cover;

-- 5. Ubah Default Column `is_active` Menjadi TRUE
alter table public.kelompok_tani_bumnag
  alter column is_active set default true;

-- 6. Aktifkan Seluruh Record Existing (jika ada record draft lama)
update public.kelompok_tani_bumnag
  set is_active = true
  where is_active = false;

commit;
