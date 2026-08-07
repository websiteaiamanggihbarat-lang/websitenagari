-- Migration: Skema Database, Trigger, RLS, Policy, dan Seed Pengaturan Layanan Informasi
-- Tanggal: 2026-08-07
-- Fitur: Layanan Informasi Dinamis Nagari Aia Manggih Barat

begin;

-- ============================================================================
-- 1. TABEL PUBLIC.LAYANAN_SURAT
-- ============================================================================

create table public.layanan_surat (
  id uuid primary key default gen_random_uuid(),
  nama_layanan text not null,
  deskripsi text null,
  estimasi_pembuatan text not null,
  form_pendataan_url text not null,
  is_active boolean not null default false,
  urutan integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ck_layanan_surat_nama_not_empty check (btrim(nama_layanan) <> ''),
  constraint ck_layanan_surat_nama_length check (char_length(btrim(nama_layanan)) >= 2 and char_length(btrim(nama_layanan)) <= 200),
  constraint ck_layanan_surat_deskripsi_length check (deskripsi is null or (btrim(deskripsi) <> '' and char_length(deskripsi) <= 3000)),
  constraint ck_layanan_surat_estimasi_not_empty check (btrim(estimasi_pembuatan) <> '' and char_length(estimasi_pembuatan) <= 200),
  constraint ck_layanan_surat_form_url_https check (form_pendataan_url ~* '^https://' and form_pendataan_url !~ '\s' and char_length(form_pendataan_url) <= 2048),
  constraint ck_layanan_surat_urutan_positive check (urutan >= 1)
);

create unique index uq_layanan_surat_nama_ci
  on public.layanan_surat (lower(btrim(nama_layanan)));

create index idx_layanan_surat_publik
  on public.layanan_surat (is_active, urutan, nama_layanan, id);

-- ============================================================================
-- 2. TABEL PUBLIC.PERSYARATAN_LAYANAN_SURAT
-- ============================================================================

create table public.persyaratan_layanan_surat (
  id uuid primary key default gen_random_uuid(),
  layanan_surat_id uuid not null,
  isi_persyaratan text not null,
  urutan integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_persyaratan_layanan_surat_parent
    foreign key (layanan_surat_id)
    references public.layanan_surat(id)
    on delete cascade,
  constraint ck_persyaratan_layanan_isi_not_empty check (btrim(isi_persyaratan) <> '' and char_length(isi_persyaratan) <= 1000),
  constraint ck_persyaratan_layanan_urutan_positive check (urutan >= 1)
);

create index idx_persyaratan_layanan_surat_parent_urutan
  on public.persyaratan_layanan_surat (layanan_surat_id, urutan, id);

-- ============================================================================
-- 3. TABEL PUBLIC.PENGATURAN_LAYANAN_INFORMASI
-- ============================================================================

create table public.pengaturan_layanan_informasi (
  id uuid primary key default gen_random_uuid(),
  slot_key text not null default 'utama',
  jadwal_pelayanan text not null,
  whatsapp_pelayanan text null,
  email_pelayanan text null,
  telepon_pelayanan text null,
  telepon_pelayanan_alternatif text null,
  alamat_pelayanan text null,
  google_maps_url text null,
  whatsapp_pengaduan text null,
  form_pengaduan_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint uq_pengaturan_layanan_informasi_slot unique (slot_key),
  constraint ck_pengaturan_layanan_informasi_slot_utama check (slot_key = 'utama'),
  constraint ck_pengaturan_layanan_jadwal_not_empty check (btrim(jadwal_pelayanan) <> '' and char_length(jadwal_pelayanan) <= 5000),
  constraint ck_pengaturan_layanan_wa_pelayanan check (whatsapp_pelayanan is null or (btrim(whatsapp_pelayanan) <> '' and char_length(whatsapp_pelayanan) <= 50 and whatsapp_pelayanan ~* '^[0-9\+\-\s\(\)\.]+$')),
  constraint ck_pengaturan_layanan_email check (email_pelayanan is null or (btrim(email_pelayanan) <> '' and char_length(email_pelayanan) <= 320 and email_pelayanan ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')),
  constraint ck_pengaturan_layanan_telepon check (telepon_pelayanan is null or (btrim(telepon_pelayanan) <> '' and char_length(telepon_pelayanan) <= 50 and telepon_pelayanan ~* '^[0-9\+\-\s\(\)\.]+$')),
  constraint ck_pengaturan_layanan_telepon_alt check (telepon_pelayanan_alternatif is null or (btrim(telepon_pelayanan_alternatif) <> '' and char_length(telepon_pelayanan_alternatif) <= 50 and telepon_pelayanan_alternatif ~* '^[0-9\+\-\s\(\)\.]+$')),
  constraint ck_pengaturan_layanan_alamat check (alamat_pelayanan is null or (btrim(alamat_pelayanan) <> '' and char_length(alamat_pelayanan) <= 1000)),
  constraint ck_pengaturan_layanan_maps_https check (google_maps_url is null or (google_maps_url ~* '^https://' and google_maps_url !~ '\s' and char_length(google_maps_url) <= 2048)),
  constraint ck_pengaturan_layanan_wa_pengaduan check (whatsapp_pengaduan is null or (btrim(whatsapp_pengaduan) <> '' and char_length(whatsapp_pengaduan) <= 50 and whatsapp_pengaduan ~* '^[0-9\+\-\s\(\)\.]+$')),
  constraint ck_pengaturan_layanan_form_pengaduan_https check (form_pengaduan_url is null or (form_pengaduan_url ~* '^https://' and form_pengaduan_url !~ '\s' and char_length(form_pengaduan_url) <= 2048))
);

-- ============================================================================
-- 4. FUNCTION & TRIGGER UPDATED_AT
-- ============================================================================

create function public.set_layanan_informasi_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_layanan_surat_updated_at
  before update on public.layanan_surat
  for each row
  execute function public.set_layanan_informasi_updated_at();

create trigger trg_persyaratan_layanan_surat_updated_at
  before update on public.persyaratan_layanan_surat
  for each row
  execute function public.set_layanan_informasi_updated_at();

create trigger trg_pengaturan_layanan_informasi_updated_at
  before update on public.pengaturan_layanan_informasi
  for each row
  execute function public.set_layanan_informasi_updated_at();

-- ============================================================================
-- 5. GUARD AKTIVASI LAYANAN SURAT
-- ============================================================================

create function public.ensure_layanan_surat_has_requirements()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.is_active = true then
    if not exists (
      select 1
      from public.persyaratan_layanan_surat p
      where p.layanan_surat_id = new.id
    ) then
      raise exception 'Layanan surat aktif wajib memiliki minimal satu persyaratan.'
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_layanan_surat_ensure_requirements
  before insert or update of is_active on public.layanan_surat
  for each row
  execute function public.ensure_layanan_surat_has_requirements();

-- ============================================================================
-- 6. SEED SINGLETON PENGATURAN LAYANAN INFORMASI
-- ============================================================================

insert into public.pengaturan_layanan_informasi (
  slot_key,
  jadwal_pelayanan,
  whatsapp_pelayanan,
  email_pelayanan,
  telepon_pelayanan,
  telepon_pelayanan_alternatif,
  alamat_pelayanan,
  google_maps_url,
  whatsapp_pengaduan,
  form_pengaduan_url
)
values (
  'utama',
  'Senin - Kamis: 08.00 - 16.00' || chr(10) || 'Jum''at: 08.00 - 16.30' || chr(10) || 'Sabtu - Minggu: Tutup',
  '+62 823-1586-3113',
  'aiamanggihbarat02@gmail.com',
  '082268789740',
  '082172235321',
  'Kantor Wali Nagari Aia Manggih Barat',
  null,
  '+62 823-1586-3113',
  'https://docs.google.com/forms/d/e/1FAIpQLSfgd5c-xQ4WCc0k1dtOcaESdmc0g_UkRfKUdEefnPS63bkt0A/viewform?usp=publish-editor'
);

-- ============================================================================
-- 7. ROW LEVEL SECURITY & POLICIES
-- ============================================================================

alter table public.layanan_surat enable row level security;
alter table public.persyaratan_layanan_surat enable row level security;
alter table public.pengaturan_layanan_informasi enable row level security;

-- Policies for public.layanan_surat
create policy policy_layanan_surat_select_public
  on public.layanan_surat
  for select
  to anon, authenticated
  using (is_active = true);

create policy policy_layanan_surat_select_admin
  on public.layanan_surat
  for select
  to authenticated
  using (true);

create policy policy_layanan_surat_insert_admin
  on public.layanan_surat
  for insert
  to authenticated
  with check (true);

create policy policy_layanan_surat_update_admin
  on public.layanan_surat
  for update
  to authenticated
  using (true)
  with check (true);

create policy policy_layanan_surat_delete_admin
  on public.layanan_surat
  for delete
  to authenticated
  using (true);

-- Policies for public.persyaratan_layanan_surat
create policy policy_persyaratan_layanan_surat_select_public
  on public.persyaratan_layanan_surat
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.layanan_surat l
      where l.id = persyaratan_layanan_surat.layanan_surat_id
        and l.is_active = true
    )
  );

create policy policy_persyaratan_layanan_surat_select_admin
  on public.persyaratan_layanan_surat
  for select
  to authenticated
  using (true);

create policy policy_persyaratan_layanan_surat_insert_admin
  on public.persyaratan_layanan_surat
  for insert
  to authenticated
  with check (true);

create policy policy_persyaratan_layanan_surat_update_admin
  on public.persyaratan_layanan_surat
  for update
  to authenticated
  using (true)
  with check (true);

create policy policy_persyaratan_layanan_surat_delete_admin
  on public.persyaratan_layanan_surat
  for delete
  to authenticated
  using (true);

-- Policies for public.pengaturan_layanan_informasi
create policy policy_pengaturan_layanan_informasi_select
  on public.pengaturan_layanan_informasi
  for select
  to anon, authenticated
  using (true);

create policy policy_pengaturan_layanan_informasi_update_admin
  on public.pengaturan_layanan_informasi
  for update
  to authenticated
  using (slot_key = 'utama')
  with check (slot_key = 'utama');

-- ============================================================================
-- 8. REVOKE & GRANT PRIVILEGES MINIMUM
-- ============================================================================

revoke all on table public.layanan_surat from public, anon, authenticated;
revoke all on table public.persyaratan_layanan_surat from public, anon, authenticated;
revoke all on table public.pengaturan_layanan_informasi from public, anon, authenticated;

grant select on public.layanan_surat to anon, authenticated;
grant select, insert, update, delete on public.layanan_surat to authenticated;

grant select on public.persyaratan_layanan_surat to anon, authenticated;
grant select, insert, update, delete on public.persyaratan_layanan_surat to authenticated;

grant select on public.pengaturan_layanan_informasi to anon, authenticated;
grant select, update on public.pengaturan_layanan_informasi to authenticated;

revoke all on function public.set_layanan_informasi_updated_at() from public, anon, authenticated;
revoke all on function public.ensure_layanan_surat_has_requirements() from public, anon, authenticated;

-- ============================================================================
-- 9. DOKUMENTASI SCHEMA & KOMENTAR
-- ============================================================================

comment on table public.layanan_surat is 'Tabel parent untuk menyimpan jenis layanan administrasi surat di Nagari Aia Manggih Barat.';
comment on column public.layanan_surat.is_active is 'Status publikasi layanan surat. Hanya bernilai true yang tampil di halaman publik.';
comment on column public.layanan_surat.form_pendataan_url is 'URL tautan formulir HTTPS eksternal (e.g. Google Form) untuk pendataan online per jenis surat.';

comment on table public.persyaratan_layanan_surat is 'Tabel child untuk menyimpan poin-poin persyaratan dokumen per layanan surat.';

comment on table public.pengaturan_layanan_informasi is 'Tabel singleton untuk menyimpan pengaturan kontak pelayanan, jadwal, alamat, dan saluran pengaduan.';
comment on column public.pengaturan_layanan_informasi.slot_key is 'Kunci unik singleton pengaturan. Hanya ada satu row bernilai ''utama''.';
comment on column public.pengaturan_layanan_informasi.jadwal_pelayanan is 'Jadwal operasional pelayanan disajikan sebagai teks multiline yang dikelola oleh admin.';
comment on column public.pengaturan_layanan_informasi.telepon_pelayanan is 'Nomor telepon utama kontak pelayanan. Disimpan murni tanpa en-dash untuk dibentuk tautan tel: oleh aplikasi.';
comment on column public.pengaturan_layanan_informasi.telepon_pelayanan_alternatif is 'Nomor telepon alternatif kontak pelayanan. Disimpan murni tanpa en-dash untuk dibentuk tautan tel: terpisah oleh aplikasi.';
comment on column public.pengaturan_layanan_informasi.whatsapp_pelayanan is 'Nomor WhatsApp kontak pelayanan disajikan sebagai teks masukan manusia dan dinormalisasi oleh aplikasi saat membentuk tautan wa.me.';
comment on column public.pengaturan_layanan_informasi.whatsapp_pengaduan is 'Nomor WhatsApp saluran pengaduan disajikan sebagai teks masukan manusia dan dinormalisasi oleh aplikasi saat membentuk tautan wa.me.';

comment on function public.ensure_layanan_surat_has_requirements() is 'Trigger function untuk mencegah layanan surat diaktifkan (is_active = true) jika belum memiliki minimal 1 persyaratan.';

commit;
