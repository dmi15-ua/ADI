-- Datos de ejemplo para el concesionario: 5 marcas, 14 coches y sus fotos.
--
-- Ejecútalo en el SQL Editor de Supabase DESPUÉS de los scripts 002, 003, 004, 007 y 008.
-- Se puede ejecutar más de una vez sin duplicar datos (no repite lo que ya existe).
-- Las fotos son imágenes de marcador de posición de https://placehold.co (hace falta conexión a internet para verlas).
-- El SQL Editor se ejecuta con permisos de administrador de la base de datos, así que no le afecta la RLS.
--
-- Con estos datos el listado tiene 13 coches disponibles (2 páginas de 9), uno sin fotos («Sin foto»)
-- y uno no disponible (no aparece en el listado, pero sí se puede ver desde la base de datos).

insert into public.marca (nombre, pais) values
  ('Seat', 'España'),
  ('Renault', 'Francia'),
  ('Volkswagen', 'Alemania'),
  ('Toyota', 'Japón'),
  ('Tesla', 'Estados Unidos')
on conflict (nombre) do nothing;

insert into public.coche (marca_id, modelo, precio, km, anio, combustible, transmision, potencia_cv, descripcion, equipamiento, disponible)
select m.id, d.modelo, d.precio, d.km, d.anio, d.combustible::public.combustible_tipo, d.transmision::public.transmision_tipo,
       d.potencia_cv, d.descripcion, d.equipamiento::jsonb, d.disponible
from (values
  ('Seat', 'Ibiza', 2019, 18500, 45000, 'diesel', 'manual', 110, 'Único dueño y revisiones al día en el concesionario.', '["Aire acondicionado", "Bluetooth", "Sensores de aparcamiento"]', true),
  ('Seat', 'León', 2021, 21900, 28000, 'gasolina', 'manual', 150, 'Muy cuidado, sin accidentes. Pantalla táctil y control de crucero.', '["Control de crucero", "Pantalla táctil", "Cámara trasera"]', true),
  ('Seat', 'Arona', 2020, 16900, 36000, 'gasolina', 'manual', 95, 'SUV urbano, ideal para ciudad. Dos llaves.', '["Aire acondicionado", "Bluetooth"]', true),
  ('Renault', 'Clio', 2018, 11900, 62000, 'gasolina', 'manual', 90, 'Económico y fiable. Recién pasada la ITV.', '["Aire acondicionado"]', true),
  ('Renault', 'Megane', 2022, 23500, 15000, 'diesel', 'automatico', 115, 'Casi nuevo, cambio automático y faros LED.', '["Faros LED", "Navegador GPS", "Cambio automático"]', true),
  ('Renault', 'Zoe', 2021, 17900, 31000, 'electrico', 'automatico', 135, 'Eléctrico con batería en propiedad y 300 km de autonomía real.', '["Carga rápida", "Navegador GPS"]', true),
  ('Volkswagen', 'Golf', 2020, 24900, 40000, 'diesel', 'automatico', 150, 'Versión Life con paquete de ayudas a la conducción.', '["Navegador GPS", "Control de crucero adaptativo", "Cámara trasera"]', true),
  ('Volkswagen', 'Polo', 2017, 10900, 78000, 'gasolina', 'manual', 95, 'Buen estado general. Mantenimiento completo.', '["Aire acondicionado", "Elevalunas eléctricos"]', true),
  ('Volkswagen', 'ID.3', 2022, 29900, 12000, 'electrico', 'automatico', 204, 'Eléctrico con casi nueva batería y garantía oficial.', '["Carga rápida", "Pantalla táctil", "Asistente de carril"]', true),
  ('Toyota', 'Yaris', 2019, 15900, 52000, 'gasolina', 'automatico', 116, 'Híbrido de bajo consumo. Muy buen mantenimiento.', '["Aire acondicionado", "Cámara trasera"]', true),
  ('Toyota', 'Corolla', 2021, 22900, 25000, 'gasolina', 'automatico', 122, 'Familiar híbrido, un solo propietario.', '["Control de crucero", "Navegador GPS", "Sensores de aparcamiento"]', true),
  ('Toyota', 'C-HR', 2018, 19900, 67000, 'gasolina', 'automatico', 122, 'SUV híbrido con diseño llamativo.', '["Navegador GPS", "Faros LED"]', true),
  ('Tesla', 'Model 3', 2021, 38900, 22000, 'electrico', 'automatico', 283, 'Long Range con piloto automático básico.', '["Piloto automático", "Techo panorámico", "Carga rápida"]', true),
  ('Seat', 'Ateca', 2016, 14500, 98000, 'diesel', 'manual', 150, 'Vendido (no aparece en el listado: disponible = false).', '["Aire acondicionado"]', false)
) as d (marca, modelo, anio, precio, km, combustible, transmision, potencia_cv, descripcion, equipamiento, disponible)
join public.marca m on m.nombre = d.marca
where not exists (
  select 1 from public.coche c where c.marca_id = m.id and c.modelo = d.modelo and c.anio = d.anio
);

insert into public.foto_coche (coche_id, url, orden, es_principal)
select c.id, f.url, f.orden, f.es_principal
from (values
  ('Seat', 'Ibiza', 2019, 'https://placehold.co/800x500/059669/ffffff/png?text=Seat+Ibiza+-+foto+1', 0, true),
  ('Seat', 'Ibiza', 2019, 'https://placehold.co/800x500/059669/ffffff/png?text=Seat+Ibiza+-+foto+2', 1, false),
  ('Seat', 'Ibiza', 2019, 'https://placehold.co/800x500/059669/ffffff/png?text=Seat+Ibiza+-+foto+3', 2, false),
  ('Seat', 'León', 2021, 'https://placehold.co/800x500/2563eb/ffffff/png?text=Seat+León+-+foto+1', 0, true),
  ('Seat', 'León', 2021, 'https://placehold.co/800x500/2563eb/ffffff/png?text=Seat+León+-+foto+2', 1, false),
  ('Seat', 'Arona', 2020, 'https://placehold.co/800x500/d97706/ffffff/png?text=Seat+Arona+-+foto+1', 0, true),
  ('Seat', 'Arona', 2020, 'https://placehold.co/800x500/d97706/ffffff/png?text=Seat+Arona+-+foto+2', 1, false),
  ('Renault', 'Megane', 2022, 'https://placehold.co/800x500/dc2626/ffffff/png?text=Renault+Megane+-+foto+1', 0, true),
  ('Renault', 'Megane', 2022, 'https://placehold.co/800x500/dc2626/ffffff/png?text=Renault+Megane+-+foto+2', 1, false),
  ('Renault', 'Megane', 2022, 'https://placehold.co/800x500/dc2626/ffffff/png?text=Renault+Megane+-+foto+3', 2, false),
  ('Renault', 'Zoe', 2021, 'https://placehold.co/800x500/0f766e/ffffff/png?text=Renault+Zoe+-+foto+1', 0, true),
  ('Renault', 'Zoe', 2021, 'https://placehold.co/800x500/0f766e/ffffff/png?text=Renault+Zoe+-+foto+2', 1, false),
  ('Volkswagen', 'Golf', 2020, 'https://placehold.co/800x500/059669/ffffff/png?text=Volkswagen+Golf+-+foto+1', 0, true),
  ('Volkswagen', 'Golf', 2020, 'https://placehold.co/800x500/059669/ffffff/png?text=Volkswagen+Golf+-+foto+2', 1, false),
  ('Volkswagen', 'Golf', 2020, 'https://placehold.co/800x500/059669/ffffff/png?text=Volkswagen+Golf+-+foto+3', 2, false),
  ('Volkswagen', 'Polo', 2017, 'https://placehold.co/800x500/2563eb/ffffff/png?text=Volkswagen+Polo+-+foto+1', 0, true),
  ('Volkswagen', 'ID.3', 2022, 'https://placehold.co/800x500/d97706/ffffff/png?text=Volkswagen+ID.3+-+foto+1', 0, true),
  ('Volkswagen', 'ID.3', 2022, 'https://placehold.co/800x500/d97706/ffffff/png?text=Volkswagen+ID.3+-+foto+2', 1, false),
  ('Toyota', 'Yaris', 2019, 'https://placehold.co/800x500/7c3aed/ffffff/png?text=Toyota+Yaris+-+foto+1', 0, true),
  ('Toyota', 'Yaris', 2019, 'https://placehold.co/800x500/7c3aed/ffffff/png?text=Toyota+Yaris+-+foto+2', 1, false),
  ('Toyota', 'Corolla', 2021, 'https://placehold.co/800x500/dc2626/ffffff/png?text=Toyota+Corolla+-+foto+1', 0, true),
  ('Toyota', 'Corolla', 2021, 'https://placehold.co/800x500/dc2626/ffffff/png?text=Toyota+Corolla+-+foto+2', 1, false),
  ('Toyota', 'C-HR', 2018, 'https://placehold.co/800x500/0f766e/ffffff/png?text=Toyota+C-HR+-+foto+1', 0, true),
  ('Tesla', 'Model 3', 2021, 'https://placehold.co/800x500/059669/ffffff/png?text=Tesla+Model+3+-+foto+1', 0, true),
  ('Tesla', 'Model 3', 2021, 'https://placehold.co/800x500/059669/ffffff/png?text=Tesla+Model+3+-+foto+2', 1, false),
  ('Tesla', 'Model 3', 2021, 'https://placehold.co/800x500/059669/ffffff/png?text=Tesla+Model+3+-+foto+3', 2, false),
  ('Seat', 'Ateca', 2016, 'https://placehold.co/800x500/2563eb/ffffff/png?text=Seat+Ateca+-+foto+1', 0, true)
) as f (marca, modelo, anio, url, orden, es_principal)
join public.marca m on m.nombre = f.marca
join public.coche c on c.marca_id = m.id and c.modelo = f.modelo and c.anio = f.anio
where not exists (
  select 1 from public.foto_coche x where x.coche_id = c.id and x.url = f.url
);

-- Comprobación: debe mostrar 5 marcas, 14 coches (13 disponibles) y 27 fotos
select (select count(*) from public.marca) as marcas,
       (select count(*) from public.coche) as coches,
       (select count(*) from public.coche where disponible) as disponibles,
       (select count(*) from public.foto_coche) as fotos;
