-- ============================================================================
-- MIGRATION: UNIFIKASI KATEGORI LEMBAGA DAN ORGANISASI
-- File: sql/alter_lembaga_organisasi_unifikasi_jenis.sql
-- Keterangan: Menormalisasi seluruh record ke jenis 'lembaga', menetapkan default
--             'lembaga' pada kolom jenis, serta memperbarui index unik agar
--             nama lembaga/organisasi bersifat unik secara case-insensitive.
-- Environment: Supabase Development (websitenagari-dev)
-- ============================================================================

begin;

-- 1. Lock tabel utama untuk mencegah perubahan bersamaan saat migrasi
lock table public.lembaga_organisasi in access exclusive mode;

-- 2. Periksa duplikasi nama case-insensitive SEBELUM update jenis
--    (dilakukan lebih dulu agar tidak terhenti oleh unique index lama uq_lembaga_organisasi_jenis_nama_ci)
do $$
declare
  v_duplicate_count bigint;
  v_sample_name text;
begin
  select count(*), max(dupes.sample_nama)
  into v_duplicate_count, v_sample_name
  from (
    select lower(btrim(nama)) as nama_ci, max(nama) as sample_nama
    from public.lembaga_organisasi
    group by lower(btrim(nama))
    having count(*) > 1
  ) dupes;

  if v_duplicate_count > 0 then
    raise exception 'Migrasi unifikasi jenis dibatalkan: Ditemukan % kelompok nama duplikat case-insensitive (Contoh: "%"). Harap selesaikan duplikasi nama terlebih dahulu.', v_duplicate_count, v_sample_name;
  end if;
end;
$$;

-- 3. Normalisasi seluruh record menjadi jenis 'lembaga'
update public.lembaga_organisasi
set jenis = 'lembaga'
where jenis is distinct from 'lembaga';

-- 4. Tetapkan default dan NOT NULL pada kolom jenis
alter table public.lembaga_organisasi
  alter column jenis set default 'lembaga',
  alter column jenis set not null;

-- 5. Drop index unik lama (tanpa IF EXISTS karena object terkonfirmasi tersedia)
drop index public.uq_lembaga_organisasi_jenis_nama_ci;

-- 6. Buat index unik baru berdasarkan nama case-insensitive (lower(btrim(nama)))
create unique index uq_lembaga_organisasi_nama_ci
  on public.lembaga_organisasi (
    lower(btrim(nama))
  );

-- 7. Perbarui komentar kolom jenis untuk menjelaskan unifikasi UI & kompatibilitas
comment on column public.lembaga_organisasi.jenis is
  'Metadata internal untuk kompatibilitas. Antarmuka tidak lagi membedakan lembaga dan organisasi; aplikasi menggunakan nilai lembaga.';

commit;
