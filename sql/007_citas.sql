-- Iteración 07: citas para pruebas de conducción
-- btree_gist permite combinar "=" (coche) y "&&" (rango de tiempo) en una restricción de exclusión
create extension if not exists btree_gist with schema extensions;

create type public.estado_cita as enum ('pendiente', 'confirmada', 'cancelada');

create table public.cita (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  coche_id bigint not null references public.coche (id) on delete cascade,
  inicio timestamptz not null,
  fin timestamptz not null,
  estado public.estado_cita not null default 'pendiente',
  nota_cliente text check (nota_cliente is null or char_length(nota_cliente) <= 500),
  created_at timestamptz not null default now(),
  -- Las citas duran siempre 30 minutos
  constraint cita_duracion check (fin - inicio = interval '30 minutes'),
  -- Un coche no puede tener dos citas activas que se solapen (las canceladas no cuentan)
  constraint cita_sin_solapes exclude using gist (
    coche_id with =,
    tstzrange(inicio, fin) with &&
  ) where (estado <> 'cancelada')
);

create index cita_usuario_id_idx on public.cita (usuario_id);
create index cita_coche_id_idx on public.cita (coche_id);

alter table public.cita enable row level security;

-- Cada usuario solo ve sus citas
create policy "cita_select_propia" on public.cita
  for select to authenticated using (usuario_id = auth.uid());

-- Solo puede crear citas a su nombre, pendientes, en el futuro y para coches disponibles
create policy "cita_insert_propia" on public.cita
  for insert to authenticated
  with check (
    usuario_id = auth.uid()
    and estado = 'pendiente'
    and inicio > now()
    and exists (select 1 from public.coche c where c.id = coche_id and c.disponible)
  );

-- Solo puede cambiar una cita propia, y solo para cancelarla
create policy "cita_cancelar_propia" on public.cita
  for update to authenticated
  using (usuario_id = auth.uid() and estado <> 'cancelada')
  with check (usuario_id = auth.uid() and estado = 'cancelada');

revoke all on public.cita from anon, authenticated;
grant select, insert on public.cita to authenticated;
grant update (estado) on public.cita to authenticated;
