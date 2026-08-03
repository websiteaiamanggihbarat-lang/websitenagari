-- ============================================================================
-- SCRIPT MIGRASI FINAL: LEMBAGA DAN ORGANISASI NAGARI DINAMIS
-- File: sql/create_lembaga_organisasi.sql
-- Keterangan: Pembuatan skema 4 tabel, constraint, index deterministik, trigger,
--             RLS, grants, policy tabel, bucket, dan policy Storage untuk
--             Lembaga dan Organisasi Nagari Dinamis.
-- Environment: Supabase Development (websitenagari-dev)
-- ============================================================================

begin;

-- ============================================================================
-- SECTION 01: TABEL PUBLIC.LEMBAGA_ORGANISASI (DATA UTAMA)
-- ============================================================================
create table public.lembaga_organisasi (
  id uuid primary key default gen_random_uuid(),
  jenis text not null,
  nama text not null,
  deskripsi text not null,
  alamat text not null,
  kontak text null,
  jam_kerja text null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Constraint 01: Whitelist jenis lembaga/organisasi
  constraint ck_lembaga_organisasi_jenis
    check (
      jenis in ('lembaga', 'organisasi')
      and jenis = btrim(jenis)
    ),

  -- Constraint 02: Validasi nama (trimmed, 2-200 karakter)
  constraint ck_lembaga_organisasi_nama
    check (
      nama = btrim(nama)
      and char_length(nama) >= 2
      and char_length(nama) <= 200
    ),

  -- Constraint 03: Validasi deskripsi (trimmed, 10-5000 karakter)
  constraint ck_lembaga_organisasi_deskripsi
    check (
      deskripsi = btrim(deskripsi)
      and char_length(deskripsi) >= 10
      and char_length(deskripsi) <= 5000
    ),

  -- Constraint 04: Validasi alamat (trimmed, 3-500 karakter)
  constraint ck_lembaga_organisasi_alamat
    check (
      alamat = btrim(alamat)
      and char_length(alamat) >= 3
      and char_length(alamat) <= 500
    ),

  -- Constraint 05: Validasi kontak (NULL atau trimmed 1-100 karakter)
  constraint ck_lembaga_organisasi_kontak
    check (
      kontak is null
      or (
        kontak = btrim(kontak)
        and char_length(kontak) >= 1
        and char_length(kontak) <= 100
      )
    ),

  -- Constraint 06: Validasi jam_kerja (NULL atau trimmed 1-300 karakter)
  constraint ck_lembaga_organisasi_jam_kerja
    check (
      jam_kerja is null
      or (
        jam_kerja = btrim(jam_kerja)
        and char_length(jam_kerja) >= 1
        and char_length(jam_kerja) <= 300
      )
    )
);

comment on table public.lembaga_organisasi is 'Tabel data utama lembaga dan organisasi Nagari Aia Manggih Barat';
comment on column public.lembaga_organisasi.id is 'Primary key unik UUID lembaga/organisasi';
comment on column public.lembaga_organisasi.jenis is 'Kategori record (lembaga atau organisasi)';
comment on column public.lembaga_organisasi.nama is 'Nama resmi lembaga atau organisasi';
comment on column public.lembaga_organisasi.deskripsi is 'Deskripsi dan profil lengkap lembaga/organisasi';
comment on column public.lembaga_organisasi.alamat is 'Alamat kantor atau lokasi kegiatan';
comment on column public.lembaga_organisasi.kontak is 'Nomor telepon atau kontak resmi (nullable)';
comment on column public.lembaga_organisasi.jam_kerja is 'Jam operasional atau jadwal kerja (nullable)';
comment on column public.lembaga_organisasi.is_active is 'Status publikasi (default false/draft)';

-- ============================================================================
-- SECTION 02: TABEL PUBLIC.PENGURUS_LEMBAGA_ORGANISASI
-- ============================================================================
create table public.pengurus_lembaga_organisasi (
  id uuid primary key default gen_random_uuid(),
  lembaga_organisasi_id uuid not null,
  nama_jabatan text not null,
  nama_pengurus text null,
  foto_url text null,
  foto_storage_path text null,
  urutan integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Foreign Key 01: Relasi ke parent data utama dengan RESTRICT
  constraint fk_pengurus_lembaga_organisasi_parent
    foreign key (lembaga_organisasi_id)
    references public.lembaga_organisasi(id)
    on update restrict
    on delete restrict,

  -- Constraint 01: Validasi nama_jabatan (trimmed, 2-150 karakter)
  constraint ck_pengurus_lembaga_organisasi_nama_jabatan
    check (
      nama_jabatan = btrim(nama_jabatan)
      and char_length(nama_jabatan) >= 2
      and char_length(nama_jabatan) <= 150
    ),

  -- Constraint 02: Validasi nama_pengurus (NULL atau trimmed 1-200 karakter)
  constraint ck_pengurus_lembaga_organisasi_nama_pengurus
    check (
      nama_pengurus is null
      or (
        nama_pengurus = btrim(nama_pengurus)
        and char_length(nama_pengurus) >= 1
        and char_length(nama_pengurus) <= 200
      )
    ),

  -- Constraint 03: Range urutan minimal 1
  constraint ck_pengurus_lembaga_organisasi_urutan
    check (
      urutan >= 1
    ),

  -- Constraint 04: Pasangan foto_url dan foto_storage_path (sama-sama NULL atau sama-sama terisi)
  constraint ck_pengurus_lembaga_organisasi_foto_pair
    check (
      (foto_url is null and foto_storage_path is null)
      or (foto_url is not null and foto_storage_path is not null)
    ),

  -- Constraint 05: Validasi foto_url (NULL atau URL HTTPS tanpa spasi)
  constraint ck_pengurus_lembaga_organisasi_foto_url
    check (
      foto_url is null
      or (
        foto_url = btrim(foto_url)
        and foto_url ~ '^https://[^[:space:]]+$'
      )
    ),

  -- Constraint 06: Validasi format foto_storage_path terikat dengan parent ID dan row ID
  constraint ck_pengurus_lembaga_organisasi_storage_path
    check (
      foto_storage_path is null
      or (
        foto_storage_path = btrim(foto_storage_path)
        and foto_storage_path ~ (
          '^lembaga-organisasi/' ||
          lembaga_organisasi_id::text ||
          '/pengurus/' ||
          id::text ||
          '/[A-Za-z0-9][A-Za-z0-9._-]*$'
        )
        and foto_storage_path !~ '(^|/)\.\.?(/|$)'
      )
    )
);

comment on table public.pengurus_lembaga_organisasi is 'Tabel struktur pengurus/jabatan lembaga dan organisasi';
comment on column public.pengurus_lembaga_organisasi.nama_jabatan is 'Nama posisi atau jabatan dalam pengurus';
comment on column public.pengurus_lembaga_organisasi.nama_pengurus is 'Nama pejabat/pengurus yang menjabat (nullable)';
comment on column public.pengurus_lembaga_organisasi.foto_url is 'URL HTTPS foto pengurus di Supabase Storage (nullable)';
comment on column public.pengurus_lembaga_organisasi.foto_storage_path is 'Path internal file pada bucket foto-lembaga-organisasi (nullable)';
comment on column public.pengurus_lembaga_organisasi.urutan is 'Urutan deterministik tampilan struktur pengurus';

-- ============================================================================
-- SECTION 03: TABEL PUBLIC.TUGAS_LEMBAGA_ORGANISASI
-- ============================================================================
create table public.tugas_lembaga_organisasi (
  id uuid primary key default gen_random_uuid(),
  lembaga_organisasi_id uuid not null,
  isi_tugas text not null,
  urutan integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Foreign Key 01: Relasi ke parent data utama dengan RESTRICT
  constraint fk_tugas_lembaga_organisasi_parent
    foreign key (lembaga_organisasi_id)
    references public.lembaga_organisasi(id)
    on update restrict
    on delete restrict,

  -- Constraint 01: Validasi isi_tugas (trimmed, 3-1000 karakter)
  constraint ck_tugas_lembaga_organisasi_isi
    check (
      isi_tugas = btrim(isi_tugas)
      and char_length(isi_tugas) >= 3
      and char_length(isi_tugas) <= 1000
    ),

  -- Constraint 02: Range urutan minimal 1
  constraint ck_tugas_lembaga_organisasi_urutan
    check (
      urutan >= 1
    )
);

comment on table public.tugas_lembaga_organisasi is 'Tabel daftar tugas dan fungsi lembaga/organisasi';
comment on column public.tugas_lembaga_organisasi.isi_tugas is 'Deskripsi atau butir item tugas';
comment on column public.tugas_lembaga_organisasi.urutan is 'Urutan deterministik tampilan daftar tugas';

-- ============================================================================
-- SECTION 04: TABEL PUBLIC.GALERI_LEMBAGA_ORGANISASI
-- ============================================================================
create table public.galeri_lembaga_organisasi (
  id uuid primary key default gen_random_uuid(),
  lembaga_organisasi_id uuid not null,
  foto_url text not null,
  foto_storage_path text not null,
  teks_alt text null,
  is_cover boolean not null default false,
  is_active boolean not null default true,
  urutan integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Foreign Key 01: Relasi ke parent data utama dengan RESTRICT
  constraint fk_galeri_lembaga_organisasi_parent
    foreign key (lembaga_organisasi_id)
    references public.lembaga_organisasi(id)
    on update restrict
    on delete restrict,

  -- Constraint 01: Validasi foto_url (URL HTTPS tanpa spasi)
  constraint ck_galeri_lembaga_organisasi_foto_url
    check (
      foto_url = btrim(foto_url)
      and foto_url ~ '^https://[^[:space:]]+$'
    ),

  -- Constraint 02: Validasi format foto_storage_path terikat dengan parent ID dan row ID
  constraint ck_galeri_lembaga_organisasi_storage_path
    check (
      foto_storage_path = btrim(foto_storage_path)
      and foto_storage_path ~ (
        '^lembaga-organisasi/' ||
        lembaga_organisasi_id::text ||
        '/galeri/' ||
        id::text ||
        '/[A-Za-z0-9][A-Za-z0-9._-]*$'
      )
      and foto_storage_path !~ '(^|/)\.\.?(/|$)'
    ),

  -- Constraint 03: Validasi teks_alt (NULL atau trimmed 1-300 karakter)
  constraint ck_galeri_lembaga_organisasi_teks_alt
    check (
      teks_alt is null
      or (
        teks_alt = btrim(teks_alt)
        and char_length(teks_alt) >= 1
        and char_length(teks_alt) <= 300
      )
    ),

  -- Constraint 04: Range urutan minimal 1
  constraint ck_galeri_lembaga_organisasi_urutan
    check (
      urutan >= 1
    ),

  -- Constraint 05: Unique storage path galeri
  constraint uq_galeri_lembaga_organisasi_storage_path
    unique (foto_storage_path)
);

comment on table public.galeri_lembaga_organisasi is 'Tabel galeri foto kegiatan dan cover lembaga/organisasi';
comment on column public.galeri_lembaga_organisasi.foto_url is 'URL HTTPS publik file foto di Supabase Storage';
comment on column public.galeri_lembaga_organisasi.foto_storage_path is 'Path internal file pada bucket foto-lembaga-organisasi';
comment on column public.galeri_lembaga_organisasi.is_cover is 'Penanda foto utama/cover untuk kartu daftar publik';
comment on column public.galeri_lembaga_organisasi.is_active is 'Status aktif foto galeri internal';
comment on column public.galeri_lembaga_organisasi.urutan is 'Urutan deterministik tampilan galeri foto';

-- ============================================================================
-- SECTION 05: INDEX DAN UNIQUE CONSTRAINT DETERMINISTIK
-- ============================================================================

-- Unique Index 01: Mencegah duplikasi nama dalam jenis yang sama (case-insensitive)
create unique index uq_lembaga_organisasi_jenis_nama_ci
  on public.lembaga_organisasi (
    jenis,
    lower(btrim(nama))
  );

-- Partial Unique Index 02: Maksimal 1 foto cover aktif per lembaga/organisasi
create unique index uq_galeri_lembaga_organisasi_cover_aktif
  on public.galeri_lembaga_organisasi (lembaga_organisasi_id)
  where is_cover = true and is_active = true;

-- Partial Unique Index 03: Unique storage path pengurus (jika foto terisi)
create unique index uq_pengurus_lembaga_organisasi_storage_path
  on public.pengurus_lembaga_organisasi (foto_storage_path)
  where foto_storage_path is not null;

-- Index 01: Query daftar publik data utama aktif
create index idx_lembaga_organisasi_public
  on public.lembaga_organisasi (
    created_at desc,
    id desc
  )
  where is_active = true;

-- Index 02: Query admin daftar seluruh data utama
create index idx_lembaga_organisasi_admin
  on public.lembaga_organisasi (
    created_at desc,
    id desc
  );

-- Index 03: Query pengurus per parent
create index idx_pengurus_lembaga_organisasi_parent_urutan
  on public.pengurus_lembaga_organisasi (
    lembaga_organisasi_id,
    urutan asc,
    created_at asc,
    id asc
  );

-- Index 04: Query tugas per parent
create index idx_tugas_lembaga_organisasi_parent_urutan
  on public.tugas_lembaga_organisasi (
    lembaga_organisasi_id,
    urutan asc,
    created_at asc,
    id asc
  );

-- Index 05: Query galeri per parent
create index idx_galeri_lembaga_organisasi_parent_urutan
  on public.galeri_lembaga_organisasi (
    lembaga_organisasi_id,
    is_cover desc,
    urutan asc,
    created_at asc,
    id asc
  );

-- ============================================================================
-- SECTION 06: FUNCTION DAN TRIGGER UPDATED_AT
-- ============================================================================
create function public.set_updated_at_lembaga_organisasi()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all
  on function public.set_updated_at_lembaga_organisasi()
  from public, anon, authenticated;

create trigger trg_lembaga_organisasi_updated_at
  before update on public.lembaga_organisasi
  for each row
  execute function public.set_updated_at_lembaga_organisasi();

create trigger trg_pengurus_lembaga_organisasi_updated_at
  before update on public.pengurus_lembaga_organisasi
  for each row
  execute function public.set_updated_at_lembaga_organisasi();

create trigger trg_tugas_lembaga_organisasi_updated_at
  before update on public.tugas_lembaga_organisasi
  for each row
  execute function public.set_updated_at_lembaga_organisasi();

create trigger trg_galeri_lembaga_organisasi_updated_at
  before update on public.galeri_lembaga_organisasi
  for each row
  execute function public.set_updated_at_lembaga_organisasi();

-- ============================================================================
-- SECTION 07: FUNCTION DAN TRIGGER VALIDASI AKTIVASI PARENT
-- ============================================================================
create function public.validate_lembaga_organisasi_activation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.is_active = true then
    if not exists (
      select 1
      from public.galeri_lembaga_organisasi g
      where g.lembaga_organisasi_id = new.id
        and g.is_active = true
        and g.is_cover = true
    ) then
      raise exception 'Lembaga atau organisasi aktif wajib memiliki foto cover aktif.'
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

revoke all
  on function public.validate_lembaga_organisasi_activation()
  from public, anon, authenticated;

create trigger trg_lembaga_organisasi_validate_activation
  before insert or update on public.lembaga_organisasi
  for each row
  execute function public.validate_lembaga_organisasi_activation();

-- ============================================================================
-- SECTION 07B: FUNCTION DAN TRIGGER AUTO-DEACTIVATE PARENT TANPA COVER
-- ============================================================================
create function public.deactivate_lembaga_organisasi_without_cover()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_parent_id uuid;
begin
  target_parent_id := old.lembaga_organisasi_id;

  if target_parent_id is not null then
    if not exists (
      select 1
      from public.galeri_lembaga_organisasi g
      where g.lembaga_organisasi_id = target_parent_id
        and g.is_active = true
        and g.is_cover = true
    ) then
      update public.lembaga_organisasi
      set is_active = false
      where id = target_parent_id
        and is_active = true;
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

revoke all
  on function public.deactivate_lembaga_organisasi_without_cover()
  from public, anon, authenticated;

create trigger trg_galeri_lembaga_organisasi_deactivate_parent_without_cover
  after update or delete on public.galeri_lembaga_organisasi
  for each row
  execute function public.deactivate_lembaga_organisasi_without_cover();

-- ============================================================================
-- SECTION 08: RLS, REVOKE, DAN GRANTS TABEL
-- ============================================================================
alter table public.lembaga_organisasi enable row level security;
alter table public.pengurus_lembaga_organisasi enable row level security;
alter table public.tugas_lembaga_organisasi enable row level security;
alter table public.galeri_lembaga_organisasi enable row level security;

revoke all on table public.lembaga_organisasi from public, anon, authenticated;
revoke all on table public.pengurus_lembaga_organisasi from public, anon, authenticated;
revoke all on table public.tugas_lembaga_organisasi from public, anon, authenticated;
revoke all on table public.galeri_lembaga_organisasi from public, anon, authenticated;

grant select on table public.lembaga_organisasi to anon;
grant select on table public.pengurus_lembaga_organisasi to anon;
grant select on table public.tugas_lembaga_organisasi to anon;
grant select on table public.galeri_lembaga_organisasi to anon;

grant select, insert, update, delete on table public.lembaga_organisasi to authenticated;
grant select, insert, update, delete on table public.pengurus_lembaga_organisasi to authenticated;
grant select, insert, update, delete on table public.tugas_lembaga_organisasi to authenticated;
grant select, insert, update, delete on table public.galeri_lembaga_organisasi to authenticated;

-- ============================================================================
-- SECTION 09: POLICY TABEL PUBLIC
-- ============================================================================

-- Policy 01: Lembaga Organisasi Policies
create policy lembaga_organisasi_anon_select
  on public.lembaga_organisasi
  for select
  to anon
  using (is_active = true);

create policy lembaga_organisasi_authenticated_all
  on public.lembaga_organisasi
  for all
  to authenticated
  using (true)
  with check (true);

-- Policy 02: Pengurus Policies
create policy pengurus_lembaga_organisasi_anon_select
  on public.pengurus_lembaga_organisasi
  for select
  to anon
  using (
    exists (
      select 1
      from public.lembaga_organisasi induk
      where induk.id = pengurus_lembaga_organisasi.lembaga_organisasi_id
        and induk.is_active = true
    )
  );

create policy pengurus_lembaga_organisasi_authenticated_all
  on public.pengurus_lembaga_organisasi
  for all
  to authenticated
  using (true)
  with check (true);

-- Policy 03: Tugas Policies
create policy tugas_lembaga_organisasi_anon_select
  on public.tugas_lembaga_organisasi
  for select
  to anon
  using (
    exists (
      select 1
      from public.lembaga_organisasi induk
      where induk.id = tugas_lembaga_organisasi.lembaga_organisasi_id
        and induk.is_active = true
    )
  );

create policy tugas_lembaga_organisasi_authenticated_all
  on public.tugas_lembaga_organisasi
  for all
  to authenticated
  using (true)
  with check (true);

-- Policy 04: Galeri Policies
create policy galeri_lembaga_organisasi_anon_select
  on public.galeri_lembaga_organisasi
  for select
  to anon
  using (
    galeri_lembaga_organisasi.is_active = true
    and exists (
      select 1
      from public.lembaga_organisasi induk
      where induk.id = galeri_lembaga_organisasi.lembaga_organisasi_id
        and induk.is_active = true
    )
  );

create policy galeri_lembaga_organisasi_authenticated_all
  on public.galeri_lembaga_organisasi
  for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================================
-- SECTION 10: BUCKET STORAGE FOTO-LEMBAGA-ORGANISASI
-- ============================================================================
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'foto-lembaga-organisasi',
  'foto-lembaga-organisasi',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[]
);

-- ============================================================================
-- SECTION 11: STORAGE POLICIES (AUTHENTICATED ONLY)
-- ============================================================================
create policy lembaga_organisasi_storage_authenticated_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'foto-lembaga-organisasi'
    and array_length(storage.foldername(name), 1) = 4
    and (storage.foldername(name))[1] = 'lembaga-organisasi'
    and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and (storage.foldername(name))[3] in ('galeri', 'pengurus')
    and (storage.foldername(name))[4] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and storage.filename(name) ~ '^[A-Za-z0-9][A-Za-z0-9._-]*$'
    and name !~ '(^|/)\.\.?(/|$)'
    and exists (
      select 1
      from public.lembaga_organisasi induk
      where induk.id::text = (storage.foldername(name))[2]
    )
  );

create policy lembaga_organisasi_storage_authenticated_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'foto-lembaga-organisasi'
    and array_length(storage.foldername(name), 1) = 4
    and (storage.foldername(name))[1] = 'lembaga-organisasi'
    and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and (storage.foldername(name))[3] in ('galeri', 'pengurus')
    and (storage.foldername(name))[4] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and storage.filename(name) ~ '^[A-Za-z0-9][A-Za-z0-9._-]*$'
    and name !~ '(^|/)\.\.?(/|$)'
    and exists (
      select 1
      from public.lembaga_organisasi induk
      where induk.id::text = (storage.foldername(name))[2]
    )
  );

create policy lembaga_organisasi_storage_authenticated_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'foto-lembaga-organisasi'
    and array_length(storage.foldername(name), 1) = 4
    and (storage.foldername(name))[1] = 'lembaga-organisasi'
    and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and (storage.foldername(name))[3] in ('galeri', 'pengurus')
    and (storage.foldername(name))[4] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and storage.filename(name) ~ '^[A-Za-z0-9][A-Za-z0-9._-]*$'
    and name !~ '(^|/)\.\.?(/|$)'
    and exists (
      select 1
      from public.lembaga_organisasi induk
      where induk.id::text = (storage.foldername(name))[2]
    )
  );

commit;
