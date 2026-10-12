-- Iteración 02: perfil de usuario
create type public.rol_usuario as enum ('cliente', 'admin');

create table public.perfil (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 2 and 100),
  telefono text check (telefono ~ '^[0-9+ ]{9,15}$'),
  rol public.rol_usuario not null default 'cliente',
  created_at timestamptz not null default now()
);

-- Crea el perfil automáticamente al registrarse un usuario en Auth
create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfil (id, nombre, telefono)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'nombre', ''), split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data->>'telefono', '')
  );
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo_usuario();

-- RLS: cada usuario solo ve y edita su propio perfil
alter table public.perfil enable row level security;

create policy "perfil_select_propio" on public.perfil
  for select to authenticated using (auth.uid() = id);

create policy "perfil_update_propio" on public.perfil
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Un usuario puede editar solo nombre y telefono (no el rol)
revoke all on public.perfil from anon, authenticated;
grant select on public.perfil to authenticated;
grant update (nombre, telefono) on public.perfil to authenticated;
