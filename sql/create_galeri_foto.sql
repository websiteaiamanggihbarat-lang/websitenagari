-- ============================================================================
-- SCRIPT MIGRASI FINAL: GALERI FOTO DINAMIS
-- File: sql/create_galeri_foto.sql
-- Keterangan: Pembuatan skema database, constraint, index, trigger, RLS, grants,
--             policy tabel, bucket, dan policy Storage untuk Galeri Foto Dinamis.
-- Environment: Supabase Development (websitenagari-dev)
-- ============================================================================

begin;

-- ============================================================================
-- SECTION 01: TABEL PUBLIC.GALERI_FOTO
-- ============================================================================
create table public.galeri_foto (
  id uuid primary key default gen_random_uuid(),
  foto_url text not null,
  foto_storage_path text not null,
  teks_alt text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ck_galeri_foto_foto_url_https
    check (
      foto_url = btrim(foto_url)
      and foto_url ~ '^https://[^[:space:]]+$'
    ),

  constraint ck_galeri_foto_storage_path_not_blank
    check (
      foto_storage_path = btrim(foto_storage_path)
      and foto_storage_path <> ''
    ),

  constraint ck_galeri_foto_storage_path_format
    check (
      foto_storage_path ~ (
        '^galeri/' ||
        id::text ||
        '/foto/[A-Za-z0-9._-]+$'
      )
    ),

  constraint ck_galeri_foto_teks_alt_not_blank
    check (
      teks_alt = btrim(teks_alt)
      and teks_alt <> ''
    ),

  constraint ck_galeri_foto_teks_alt_length
    check (
      char_length(teks_alt) <= 300
    ),

  constraint uq_galeri_foto_storage_path
    unique (foto_storage_path)
);

comment on table public.galeri_foto is 'Tabel penyimpanan metadata dan path gambar galeri foto Nagari Aia Manggih Barat';
comment on column public.galeri_foto.foto_url is 'URL publik HTTPS file gambar di Supabase Storage';
comment on column public.galeri_foto.foto_storage_path is 'Path internal file pada bucket foto-galeri-nagari';
comment on column public.galeri_foto.teks_alt is 'Teks alternatif untuk aksesibilitas pembaca layar (screen reader)';
comment on column public.galeri_foto.is_active is 'Status aktif internal untuk alur Safe Delete';

-- ============================================================================
-- SECTION 02: INDEX DETERMINISTIK
-- ============================================================================
create index idx_galeri_foto_publik
  on public.galeri_foto (
    created_at desc,
    id desc
  )
  where is_active = true;

create index idx_galeri_foto_admin
  on public.galeri_foto (
    created_at desc,
    id desc
  );

-- ============================================================================
-- SECTION 03: FUNCTION DAN TRIGGER UPDATED_AT
-- ============================================================================
create function public.set_updated_at_galeri_foto()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_galeri_foto_updated_at
  before update on public.galeri_foto
  for each row
  execute function public.set_updated_at_galeri_foto();

-- ============================================================================
-- SECTION 04: RLS, REVOKE, DAN GRANTS TABEL
-- ============================================================================
alter table public.galeri_foto
  enable row level security;

revoke all
  on table public.galeri_foto
  from public, anon, authenticated;

grant select
  on table public.galeri_foto
  to anon;

grant select, insert, delete
  on table public.galeri_foto
  to authenticated;

grant update (is_active)
  on table public.galeri_foto
  to authenticated;

-- ============================================================================
-- SECTION 05: POLICY TABEL PUBLIC.GALERI_FOTO
-- ============================================================================
create policy galeri_foto_anon_select_active
  on public.galeri_foto
  for select
  to anon
  using (is_active = true);

create policy galeri_foto_authenticated_select
  on public.galeri_foto
  for select
  to authenticated
  using (true);

create policy galeri_foto_authenticated_insert
  on public.galeri_foto
  for insert
  to authenticated
  with check (is_active = true);

create policy galeri_foto_authenticated_update
  on public.galeri_foto
  for update
  to authenticated
  using (true)
  with check (true);

create policy galeri_foto_authenticated_delete
  on public.galeri_foto
  for delete
  to authenticated
  using (true);

-- ============================================================================
-- SECTION 06: BUCKET STORAGE FOTO-GALERI-NAGARI
-- ============================================================================
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'foto-galeri-nagari',
  'foto-galeri-nagari',
  true,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[]
);

-- ============================================================================
-- SECTION 07: POLICY STORAGE.OBJECTS (BUCKET FOTO-GALERI-NAGARI)
-- ============================================================================
create policy galeri_foto_storage_authenticated_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'foto-galeri-nagari'
    and array_length(storage.foldername(name), 1) = 3
    and (storage.foldername(name))[1] = 'galeri'
    and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (storage.foldername(name))[3] = 'foto'
    and name !~ '(^|/)\.\.?(/|$)'
  );

create policy galeri_foto_storage_authenticated_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'foto-galeri-nagari'
    and array_length(storage.foldername(name), 1) = 3
    and (storage.foldername(name))[1] = 'galeri'
    and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (storage.foldername(name))[3] = 'foto'
    and name !~ '(^|/)\.\.?(/|$)'
  );

create policy galeri_foto_storage_authenticated_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'foto-galeri-nagari'
    and array_length(storage.foldername(name), 1) = 3
    and (storage.foldername(name))[1] = 'galeri'
    and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and (storage.foldername(name))[3] = 'foto'
    and name !~ '(^|/)\.\.?(/|$)'
  );

commit;
