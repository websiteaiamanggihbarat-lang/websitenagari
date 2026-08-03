begin;

alter table public.galeri_foto
  alter column teks_alt drop not null;

commit;
