-- Iteración 08: coches favoritos de cada usuario
create table public.favorito (
  usuario_id uuid not null references auth.users (id) on delete cascade,
  coche_id bigint not null references public.coche (id) on delete cascade,
  fecha_guardado timestamptz not null default now(),
  -- Un usuario no puede guardar dos veces el mismo coche
  primary key (usuario_id, coche_id)
);

create index favorito_coche_id_idx on public.favorito (coche_id);

alter table public.favorito enable row level security;

-- Cada usuario solo ve, crea y borra sus propios favoritos
create policy "favorito_select_propio" on public.favorito
  for select to authenticated using (usuario_id = auth.uid());

create policy "favorito_insert_propio" on public.favorito
  for insert to authenticated with check (usuario_id = auth.uid());

create policy "favorito_delete_propio" on public.favorito
  for delete to authenticated using (usuario_id = auth.uid());

revoke all on public.favorito from anon, authenticated;
grant select, insert, delete on public.favorito to authenticated;
