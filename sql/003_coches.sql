-- Iteración 03: marcas, coches y fotos
create type public.combustible_tipo as enum ('gasolina', 'diesel', 'electrico');
create type public.transmision_tipo as enum ('manual', 'automatico');

create table public.marca (
  id bigint generated always as identity primary key,
  nombre text not null unique check (char_length(nombre) between 2 and 50),
  pais text check (pais is null or char_length(pais) between 2 and 50)
);

create table public.coche (
  id bigint generated always as identity primary key,
  marca_id bigint not null references public.marca (id),
  modelo text not null check (char_length(modelo) between 1 and 100),
  precio numeric(10, 2) not null check (precio > 0),
  km integer not null check (km >= 0),
  anio integer not null check (anio between 1950 and 2100),
  combustible public.combustible_tipo not null,
  transmision public.transmision_tipo not null,
  potencia_cv integer not null check (potencia_cv > 0),
  descripcion text check (descripcion is null or char_length(descripcion) <= 2000),
  equipamiento jsonb not null default '[]'::jsonb check (jsonb_typeof(equipamiento) = 'array'),
  disponible boolean not null default true,
  created_at timestamptz not null default now()
);

create index coche_marca_id_idx on public.coche (marca_id);

create table public.foto_coche (
  id bigint generated always as identity primary key,
  coche_id bigint not null references public.coche (id) on delete cascade,
  url text not null check (url ~ '^https?://'),
  orden integer not null default 0,
  es_principal boolean not null default false
);

create index foto_coche_coche_id_idx on public.foto_coche (coche_id);
-- Como mucho una foto principal por coche
create unique index foto_coche_una_principal on public.foto_coche (coche_id) where es_principal;

-- ¿El usuario autenticado es administrador?
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfil where id = auth.uid() and rol = 'admin'
  );
$$;

-- RLS: el catálogo es público para leer; solo un admin escribe
alter table public.marca enable row level security;
alter table public.coche enable row level security;
alter table public.foto_coche enable row level security;

create policy "marca_select_publico" on public.marca for select to anon, authenticated using (true);
create policy "marca_insert_admin" on public.marca for insert to authenticated with check (public.es_admin());
create policy "marca_update_admin" on public.marca for update to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "marca_delete_admin" on public.marca for delete to authenticated using (public.es_admin());

create policy "coche_select_publico" on public.coche for select to anon, authenticated using (true);
create policy "coche_insert_admin" on public.coche for insert to authenticated with check (public.es_admin());
create policy "coche_update_admin" on public.coche for update to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "coche_delete_admin" on public.coche for delete to authenticated using (public.es_admin());

create policy "foto_select_publico" on public.foto_coche for select to anon, authenticated using (true);
create policy "foto_insert_admin" on public.foto_coche for insert to authenticated with check (public.es_admin());
create policy "foto_update_admin" on public.foto_coche for update to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "foto_delete_admin" on public.foto_coche for delete to authenticated using (public.es_admin());

-- Permisos de tabla (la RLS decide después qué filas)
revoke all on public.marca, public.coche, public.foto_coche from anon, authenticated;
grant select on public.marca, public.coche, public.foto_coche to anon, authenticated;
grant insert, update, delete on public.marca, public.coche, public.foto_coche to authenticated;
