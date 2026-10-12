-- Iteración 04: índices para las búsquedas y filtros del catálogo
create index if not exists coche_precio_idx on public.coche (precio);
create index if not exists coche_combustible_idx on public.coche (combustible);
create index if not exists coche_transmision_idx on public.coche (transmision);
create index if not exists coche_disponible_idx on public.coche (disponible);
