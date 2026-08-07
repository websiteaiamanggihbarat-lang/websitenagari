begin;

-- =====================================================
-- TABEL JADWAL PELAYANAN INFORMASI TERSTRUKTUR
-- =====================================================

create table public.jadwal_pelayanan_informasi (
  id uuid primary key default gen_random_uuid(),
  hari_key text not null,
  is_tutup boolean not null default false,
  jam_buka time without time zone null,
  jam_tutup time without time zone null,
  urutan integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_jadwal_pelayanan_hari_key check (
    hari_key in ('senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu')
  ),
  constraint uq_jadwal_pelayanan_hari_key unique (hari_key),
  constraint uq_jadwal_pelayanan_urutan unique (urutan),
  constraint ck_jadwal_pelayanan_urutan check (
    urutan >= 1 and urutan <= 7
  ),
  constraint ck_jadwal_pelayanan_hari_urutan check (
    (hari_key = 'senin' and urutan = 1) or
    (hari_key = 'selasa' and urutan = 2) or
    (hari_key = 'rabu' and urutan = 3) or
    (hari_key = 'kamis' and urutan = 4) or
    (hari_key = 'jumat' and urutan = 5) or
    (hari_key = 'sabtu' and urutan = 6) or
    (hari_key = 'minggu' and urutan = 7)
  ),
  constraint ck_jadwal_pelayanan_waktu check (
    (is_tutup = true and jam_buka is null and jam_tutup is null)
    or
    (is_tutup = false and jam_buka is not null and jam_tutup is not null and jam_tutup > jam_buka)
  )
);

-- Trigger updated_at menggunakan function existing
create trigger trg_jadwal_pelayanan_informasi_updated_at
  before update
  on public.jadwal_pelayanan_informasi
  for each row
  execute function public.set_layanan_informasi_updated_at();

-- =====================================================
-- SEED DATA TEPAT TUJUH HARI
-- =====================================================

insert into public.jadwal_pelayanan_informasi (hari_key, is_tutup, jam_buka, jam_tutup, urutan)
values
  ('senin', false, '08:00', '16:00', 1),
  ('selasa', false, '08:00', '16:00', 2),
  ('rabu', false, '08:00', '16:00', 3),
  ('kamis', false, '08:00', '16:00', 4),
  ('jumat', false, '08:00', '16:30', 5),
  ('sabtu', true, null, null, 6),
  ('minggu', true, null, null, 7);

-- =====================================================
-- RLS DAN PRIVILEGES TABEL
-- =====================================================

alter table public.jadwal_pelayanan_informasi
  enable row level security;

create policy policy_jadwal_pelayanan_informasi_select_public
  on public.jadwal_pelayanan_informasi
  for select
  to anon, authenticated
  using (true);

revoke all on table public.jadwal_pelayanan_informasi
  from public, anon, authenticated;

grant select
  on table public.jadwal_pelayanan_informasi
  to anon, authenticated;

-- =====================================================
-- RPC FUNCTION UPDATE JADWAL ATOMIK (SECURITY DEFINER)
-- =====================================================

create function public.update_jadwal_pelayanan_informasi(
  p_rows jsonb
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_tbl_count integer;
  v_tbl_pairs_count integer;
  v_count integer;
  v_keys text[];
  v_row jsonb;
  v_hari_key text;
  v_is_tutup boolean;
  v_jam_buka time without time zone;
  v_jam_tutup time without time zone;
  v_affected integer;
begin
  -- 1. Validasi Baseline Tabel
  select count(*) into v_tbl_count
  from public.jadwal_pelayanan_informasi;

  if v_tbl_count <> 7 then
    raise exception 'Tabel jadwal pelayanan informasi harus berisi tepat 7 baris.'
      using errcode = 'P0001';
  end if;

  select count(*) into v_tbl_pairs_count
  from public.jadwal_pelayanan_informasi
  where
    (hari_key = 'senin' and urutan = 1) or
    (hari_key = 'selasa' and urutan = 2) or
    (hari_key = 'rabu' and urutan = 3) or
    (hari_key = 'kamis' and urutan = 4) or
    (hari_key = 'jumat' and urutan = 5) or
    (hari_key = 'sabtu' and urutan = 6) or
    (hari_key = 'minggu' and urutan = 7);

  if v_tbl_pairs_count <> 7 then
    raise exception 'Struktur baris tabel jadwal pelayanan informasi di database tidak valid.'
      using errcode = 'P0001';
  end if;

  -- 2. Validasi Top-Level JSON Payload
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Payload harus berupa JSON array.'
      using errcode = 'P0001';
  end if;

  v_count := jsonb_array_length(p_rows);
  if v_count <> 7 then
    raise exception 'Payload harus berisi tepat 7 hari pelayanan.'
      using errcode = 'P0001';
  end if;

  -- 3. Validasi Keunikan & Kelengkapan Hari Payload
  select array_agg(distinct (r->>'hari_key'))
  into v_keys
  from jsonb_array_elements(p_rows) as r
  where r->>'hari_key' in ('senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu');

  if array_length(v_keys, 1) is null or array_length(v_keys, 1) <> 7 then
    raise exception 'Payload harus mencakup setiap hari senin sampai minggu tepat satu kali.'
      using errcode = 'P0001';
  end if;

  -- 4. Validasi Struktur Object & Field Setiap Element Payload
  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    if jsonb_typeof(v_row) <> 'object' then
      raise exception 'Setiap elemen payload harus berupa JSON object.'
        using errcode = 'P0001';
    end if;

    v_hari_key := v_row->>'hari_key';
    if v_hari_key not in ('senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu') then
      raise exception 'Nama hari_key % tidak valid.', v_hari_key
        using errcode = 'P0001';
    end if;

    if v_row->'is_tutup' is null or jsonb_typeof(v_row->'is_tutup') <> 'boolean' then
      raise exception 'Field is_tutup untuk hari % harus berjenis boolean.', v_hari_key
        using errcode = 'P0001';
    end if;

    v_is_tutup := (v_row->>'is_tutup')::boolean;

    if v_is_tutup then
      if (v_row->>'jam_buka') is not null or (v_row->>'jam_tutup') is not null then
        raise exception 'Hari % yang tutup tidak boleh memiliki jam buka atau jam tutup.', v_hari_key
          using errcode = 'P0001';
      end if;
      v_jam_buka := null;
      v_jam_tutup := null;
    else
      if (v_row->>'jam_buka') is null or (v_row->>'jam_tutup') is null then
        raise exception 'Hari % yang buka wajib mengisi jam buka dan jam tutup.', v_hari_key
          using errcode = 'P0001';
      end if;

      begin
        v_jam_buka := (v_row->>'jam_buka')::time;
        v_jam_tutup := (v_row->>'jam_tutup')::time;
      exception when others then
        raise exception 'Format jam buka/tutup untuk hari % tidak valid.', v_hari_key
          using errcode = 'P0001';
      end;

      if v_jam_tutup <= v_jam_buka then
        raise exception 'Jam tutup harus lebih besar dari jam buka pada hari %.', v_hari_key
          using errcode = 'P0001';
      end if;
    end if;
  end loop;

  -- 5. Eksekusi UPDATE Atomik untuk 7 Baris
  with payload_data as (
    select
      r->>'hari_key' as hari_key,
      (r->>'is_tutup')::boolean as is_tutup,
      case when (r->>'is_tutup')::boolean then null else (r->>'jam_buka')::time end as jam_buka,
      case when (r->>'is_tutup')::boolean then null else (r->>'jam_tutup')::time end as jam_tutup
    from jsonb_array_elements(p_rows) as r
  )
  update public.jadwal_pelayanan_informasi as j
  set
    is_tutup = p.is_tutup,
    jam_buka = p.jam_buka,
    jam_tutup = p.jam_tutup
  from payload_data as p
  where j.hari_key = p.hari_key;

  get diagnostics v_affected = row_count;

  if v_affected <> 7 then
    raise exception 'UPDATE jadwal pelayanan gagal: jumlah baris ter-update (%) tidak sesuai.', v_affected
      using errcode = 'P0001';
  end if;
end;
$$;

-- =====================================================
-- PRIVILEGES FUNCTION
-- =====================================================

revoke all on function public.update_jadwal_pelayanan_informasi(jsonb)
  from public, anon, authenticated;

grant execute on function public.update_jadwal_pelayanan_informasi(jsonb)
  to authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

comment on table public.jadwal_pelayanan_informasi is 'Jadwal pelayanan terstruktur Senin sampai Minggu.';
comment on column public.jadwal_pelayanan_informasi.hari_key is 'Kunci hari tetap: senin sampai minggu.';
comment on column public.jadwal_pelayanan_informasi.is_tutup is 'Menentukan apakah pelayanan tutup pada hari tersebut.';
comment on column public.jadwal_pelayanan_informasi.jam_buka is 'Jam mulai pelayanan jika hari buka.';
comment on column public.jadwal_pelayanan_informasi.jam_tutup is 'Jam selesai pelayanan jika hari buka.';
comment on column public.jadwal_pelayanan_informasi.urutan is 'Urutan tetap hari Senin=1 sampai Minggu=7.';
comment on function public.update_jadwal_pelayanan_informasi(jsonb) is 'Memperbarui seluruh jadwal tujuh hari secara atomik. SECURITY DEFINER digunakan agar authenticated hanya dapat mengubah jadwal melalui function terkontrol dan tidak melalui UPDATE tabel langsung.';

comment on column public.pengaturan_layanan_informasi.jadwal_pelayanan is 'Legacy jadwal berbentuk teks. Aplikasi baru menggunakan public.jadwal_pelayanan_informasi.';

commit;
