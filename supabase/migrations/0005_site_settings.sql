-- 0005_site_settings.sql
-- Ajustes del sitio guardados en la base (portada de inicio, ventana de bienvenida / anuncios).
-- Antes vivian en el localStorage del navegador del admin y nadie mas los veia.
-- Lectura publica (la web los pide sin sesion); solo un admin puede escribir.
-- Es seguro ejecutarla varias veces.

create table if not exists public.site_settings (
  key         text primary key check (key ~ '^[a-z0-9_]{1,60}$'),
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null
);

comment on table public.site_settings is 'Ajustes del sitio editables desde el panel admin (clave -> JSON).';

create or replace function public.stamp_site_setting()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists site_settings_stamp on public.site_settings;
create trigger site_settings_stamp
  before insert or update on public.site_settings
  for each row execute function public.stamp_site_setting();

alter table public.site_settings enable row level security;

drop policy if exists "site_settings: lectura publica" on public.site_settings;
create policy "site_settings: lectura publica"
  on public.site_settings for select to anon, authenticated
  using (true);

drop policy if exists "site_settings: admin crea" on public.site_settings;
create policy "site_settings: admin crea"
  on public.site_settings for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "site_settings: admin edita" on public.site_settings;
create policy "site_settings: admin edita"
  on public.site_settings for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "site_settings: admin borra" on public.site_settings;
create policy "site_settings: admin borra"
  on public.site_settings for delete to authenticated
  using ((select public.is_admin()));

-- Bucket publico para la imagen/video de portada y del anuncio (hasta 50 MB).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "site-media: admin sube" on storage.objects;
create policy "site-media: admin sube"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'site-media' and (select public.is_admin()));

drop policy if exists "site-media: admin cambia" on storage.objects;
create policy "site-media: admin cambia"
  on storage.objects for update to authenticated
  using (bucket_id = 'site-media' and (select public.is_admin()))
  with check (bucket_id = 'site-media' and (select public.is_admin()));

drop policy if exists "site-media: admin borra" on storage.objects;
create policy "site-media: admin borra"
  on storage.objects for delete to authenticated
  using (bucket_id = 'site-media' and (select public.is_admin()));
