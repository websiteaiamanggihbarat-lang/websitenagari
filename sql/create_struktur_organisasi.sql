-- ============================================================================
-- SCRIPT MIGRASI FINAL: STRUKTUR ORGANISASI DINAMIS
-- File: sql/create_struktur_organisasi.sql
-- Keterangan: Pembuatan skema database, constraint, index, trigger, seed 16 slot,
--             RLS, grants, policy tabel, bucket, dan policy Storage untuk
--             Struktur Organisasi Dinamis.
-- Environment: Supabase Development (websitenagari-dev)
-- ============================================================================

begin;

-- ============================================================================
-- SECTION 01: TABEL PUBLIC.STRUKTUR_ORGANISASI
-- ============================================================================
create table public.struktur_organisasi (
  slot_key text primary key,
  nama_jabatan text not null,
  nama_pejabat text null,
  foto_url text null,
  foto_storage_path text null,
  parent_slot_key text null,
  kelompok_layout text not null,
  urutan integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Constraint 01: Format slot_key (trimmed, lowercase, snake_case)
  constraint ck_struktur_organisasi_slot_key_format
    check (
      slot_key = btrim(slot_key)
      and slot_key = lower(slot_key)
      and slot_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'
    ),

  -- Constraint 02: Whitelist tepat 16 slot_key resmi
  constraint ck_struktur_organisasi_slot_key_allowed
    check (
      slot_key in (
        'wali_nagari',
        'sekretaris_nagari',
        'kasi_pemerintahan',
        'staf_pemerintahan',
        'petugas_data',
        'kasi_kesra_pelayanan',
        'staf_kesra_pelayanan',
        'petugas_keagamaan',
        'kaur_umum',
        'staf_kaur_umum',
        'staf_kebersihan',
        'staf_keamanan',
        'kaur_keuangan',
        'staf_kaur_keuangan',
        'ka_jorong_padang_sarai',
        'ka_jorong_kp_padang_paraman_dareh'
      )
    ),

  -- Constraint 03: Validasi nama_jabatan (trimmed, 1-150 karakter)
  constraint ck_struktur_organisasi_nama_jabatan_valid
    check (
      nama_jabatan = btrim(nama_jabatan)
      and char_length(nama_jabatan) >= 1
      and char_length(nama_jabatan) <= 150
    ),

  -- Constraint 04: Validasi nama_pejabat (NULL atau trimmed 1-200 karakter)
  constraint ck_struktur_organisasi_nama_pejabat_valid
    check (
      nama_pejabat is null
      or (
        nama_pejabat = btrim(nama_pejabat)
        and char_length(nama_pejabat) >= 1
        and char_length(nama_pejabat) <= 200
      )
    ),

  -- Constraint 05: Parent tidak boleh self-reference
  constraint ck_struktur_organisasi_parent_not_self
    check (
      parent_slot_key is null
      or parent_slot_key <> slot_key
    ),

  -- Constraint 06: Foreign key parent_slot_key dengan RESTRICT
  constraint fk_struktur_organisasi_parent
    foreign key (parent_slot_key)
    references public.struktur_organisasi(slot_key)
    on update restrict
    on delete restrict,

  -- Constraint 07: Whitelist kelompok_layout
  constraint ck_struktur_organisasi_kelompok_layout
    check (
      kelompok_layout in (
        'pimpinan',
        'sekretariat',
        'kasi_pemerintahan',
        'kasi_kesra',
        'kaur_umum',
        'kaur_keuangan',
        'wilayah_jorong'
      )
    ),

  -- Constraint 08: Range urutan 1 sampai 16
  constraint ck_struktur_organisasi_urutan_range
    check (
      urutan between 1 and 16
    ),

  -- Constraint 09: Unique urutan
  constraint uq_struktur_organisasi_urutan
    unique (urutan),

  -- Constraint 10: Pasangan foto_url dan foto_storage_path (sama-sama NULL atau sama-sama terisi)
  constraint ck_struktur_organisasi_foto_pair
    check (
      (foto_url is null and foto_storage_path is null)
      or (foto_url is not null and foto_storage_path is not null)
    ),

  -- Constraint 11: Validasi foto_url (NULL atau URL HTTPS tanpa spasi)
  constraint ck_struktur_organisasi_foto_url_https
    check (
      foto_url is null
      or (
        foto_url = btrim(foto_url)
        and foto_url ~ '^https://[^[:space:]]+$'
      )
    ),

  -- Constraint 12: Validasi format foto_storage_path terikat dengan slot_key record
  constraint ck_struktur_organisasi_storage_path_format
    check (
      foto_storage_path is null
      or (
        foto_storage_path = btrim(foto_storage_path)
        and foto_storage_path ~ (
          '^struktur-organisasi/' ||
          slot_key ||
          '/foto/[A-Za-z0-9._-]+$'
        )
        and foto_storage_path !~ '(^|/)\.\.?(/|$)'
      )
    )
);

comment on table public.struktur_organisasi is 'Tabel penyimpanan data 16 slot tetap struktur organisasi Nagari Aia Manggih Barat';
comment on column public.struktur_organisasi.slot_key is 'Primary key unik dan stabil untuk setiap slot posisi tetap';
comment on column public.struktur_organisasi.nama_jabatan is 'Label nama jabatan resmi organisasi Nagari';
comment on column public.struktur_organisasi.nama_pejabat is 'Nama pejabat yang menjabat posisi saat ini (nullable)';
comment on column public.struktur_organisasi.foto_url is 'URL HTTPS publik foto pejabat di Supabase Storage';
comment on column public.struktur_organisasi.foto_storage_path is 'Path internal file pada bucket foto-struktur-organisasi';
comment on column public.struktur_organisasi.parent_slot_key is 'Foreign key atasan langsung untuk susunan hierarki';
comment on column public.struktur_organisasi.kelompok_layout is 'Pengelompokan posisi untuk layout bagan desktop & mobile';
comment on column public.struktur_organisasi.urutan is 'Urutan deterministik tampilan posisi (1-16)';

-- ============================================================================
-- SECTION 02: INDEX DETERMINISTIK
-- ============================================================================
create index idx_struktur_organisasi_parent_urutan
  on public.struktur_organisasi (
    parent_slot_key,
    urutan asc
  )
  where parent_slot_key is not null;

create index idx_struktur_organisasi_kelompok_urutan
  on public.struktur_organisasi (
    kelompok_layout,
    urutan asc
  );

-- ============================================================================
-- SECTION 03: FUNCTION DAN TRIGGER UPDATED_AT
-- ============================================================================
create function public.set_updated_at_struktur_organisasi()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_struktur_organisasi_updated_at
  before update on public.struktur_organisasi
  for each row
  execute function public.set_updated_at_struktur_organisasi();

revoke all
  on function public.set_updated_at_struktur_organisasi()
  from public, anon, authenticated;

-- ============================================================================
-- SECTION 04: SEED DATA 16 SLOT JABATAN TETAP (PARENT-FIRST)
-- ============================================================================
insert into public.struktur_organisasi (
  slot_key,
  nama_jabatan,
  nama_pejabat,
  foto_url,
  foto_storage_path,
  parent_slot_key,
  kelompok_layout,
  urutan
)
values
  (
    'wali_nagari',
    'Wali Nagari',
    'Afdel Haq, S.Pd.I',
    null,
    null,
    null,
    'pimpinan',
    1
  ),
  (
    'sekretaris_nagari',
    'Sekretaris Nagari',
    'Riko Julhasra S.Hum',
    null,
    null,
    'wali_nagari',
    'sekretariat',
    2
  ),
  (
    'kasi_pemerintahan',
    'Kasi Pemerintahan',
    'Mahyeli Irwan',
    null,
    null,
    'wali_nagari',
    'kasi_pemerintahan',
    3
  ),
  (
    'staf_pemerintahan',
    'Staf Pemerintahan',
    'Hasmaini, S.Pd.',
    null,
    null,
    'kasi_pemerintahan',
    'kasi_pemerintahan',
    4
  ),
  (
    'petugas_data',
    'Petugas Data',
    'Khairil Hamdi, S.M',
    null,
    null,
    'staf_pemerintahan',
    'kasi_pemerintahan',
    5
  ),
  (
    'kasi_kesra_pelayanan',
    'Kasi Kesra dan Pelayanan',
    'Hengki Pratama Effendi, S.H.',
    null,
    null,
    'wali_nagari',
    'kasi_kesra',
    6
  ),
  (
    'staf_kesra_pelayanan',
    'Staf Kesra dan Pelayanan',
    'Muhammad Yefri, S.Pd.',
    null,
    null,
    'kasi_kesra_pelayanan',
    'kasi_kesra',
    7
  ),
  (
    'petugas_keagamaan',
    'Petugas Keagamaan',
    'Nugraha Candra M.F, S.Pt',
    null,
    null,
    'staf_kesra_pelayanan',
    'kasi_kesra',
    8
  ),
  (
    'kaur_umum',
    'Kaur Umum',
    'Syafrida',
    null,
    null,
    'sekretaris_nagari',
    'kaur_umum',
    9
  ),
  (
    'staf_kaur_umum',
    'Staf',
    'Dian Rahmanita',
    null,
    null,
    'kaur_umum',
    'kaur_umum',
    10
  ),
  (
    'staf_kebersihan',
    'Staf Kebersihan',
    'Herlina',
    null,
    null,
    'staf_kaur_umum',
    'kaur_umum',
    11
  ),
  (
    'staf_keamanan',
    'Staf Keamanan',
    'Mery Oktavia',
    null,
    null,
    'staf_kaur_umum',
    'kaur_umum',
    12
  ),
  (
    'kaur_keuangan',
    'Kaur Keuangan',
    'Westi Megasari, S.Pd.I.',
    null,
    null,
    'sekretaris_nagari',
    'kaur_keuangan',
    13
  ),
  (
    'staf_kaur_keuangan',
    'Staf',
    'Rini, S.Pd.',
    null,
    null,
    'kaur_keuangan',
    'kaur_keuangan',
    14
  ),
  (
    'ka_jorong_padang_sarai',
    'Ka. Jorong Padang Sarai',
    'Lahmizal Netri',
    null,
    null,
    'wali_nagari',
    'wilayah_jorong',
    15
  ),
  (
    'ka_jorong_kp_padang_paraman_dareh',
    'Ka. Jorong Kampung Padang Paraman Dareh',
    'Israhayu, S.E',
    null,
    null,
    'wali_nagari',
    'wilayah_jorong',
    16
  );

-- ============================================================================
-- SECTION 05: RLS, REVOKE, DAN GRANTS TABEL
-- ============================================================================
alter table public.struktur_organisasi
  enable row level security;

revoke all
  on table public.struktur_organisasi
  from public, anon, authenticated;

grant select
  on table public.struktur_organisasi
  to anon;

grant select
  on table public.struktur_organisasi
  to authenticated;

grant update (nama_pejabat, foto_url, foto_storage_path)
  on table public.struktur_organisasi
  to authenticated;

-- ============================================================================
-- SECTION 06: POLICY TABEL PUBLIC.STRUKTUR_ORGANISASI
-- ============================================================================
create policy struktur_organisasi_anon_select
  on public.struktur_organisasi
  for select
  to anon
  using (true);

create policy struktur_organisasi_authenticated_select
  on public.struktur_organisasi
  for select
  to authenticated
  using (true);

create policy struktur_organisasi_authenticated_update
  on public.struktur_organisasi
  for update
  to authenticated
  using (true)
  with check (true);

-- ============================================================================
-- SECTION 07: BUCKET STORAGE FOTO-STRUKTUR-ORGANISASI
-- ============================================================================
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'foto-struktur-organisasi',
  'foto-struktur-organisasi',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[]
);

-- ============================================================================
-- SECTION 08: POLICY STORAGE.OBJECTS (BUCKET FOTO-STRUKTUR-ORGANISASI)
-- ============================================================================
create policy struktur_organisasi_storage_authenticated_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'foto-struktur-organisasi'
    and array_length(storage.foldername(name), 1) = 3
    and (storage.foldername(name))[1] = 'struktur-organisasi'
    and (storage.foldername(name))[2] ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'
    and (storage.foldername(name))[3] = 'foto'
    and name !~ '(^|/)\.\.?(/|$)'
    and exists (
      select 1
      from public.struktur_organisasi s
      where s.slot_key = (storage.foldername(name))[2]
    )
  );

create policy struktur_organisasi_storage_authenticated_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'foto-struktur-organisasi'
    and array_length(storage.foldername(name), 1) = 3
    and (storage.foldername(name))[1] = 'struktur-organisasi'
    and (storage.foldername(name))[2] ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'
    and (storage.foldername(name))[3] = 'foto'
    and name !~ '(^|/)\.\.?(/|$)'
    and exists (
      select 1
      from public.struktur_organisasi s
      where s.slot_key = (storage.foldername(name))[2]
    )
  );

create policy struktur_organisasi_storage_authenticated_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'foto-struktur-organisasi'
    and array_length(storage.foldername(name), 1) = 3
    and (storage.foldername(name))[1] = 'struktur-organisasi'
    and (storage.foldername(name))[2] ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'
    and (storage.foldername(name))[3] = 'foto'
    and name !~ '(^|/)\.\.?(/|$)'
    and exists (
      select 1
      from public.struktur_organisasi s
      where s.slot_key = (storage.foldername(name))[2]
    )
  );

commit;
