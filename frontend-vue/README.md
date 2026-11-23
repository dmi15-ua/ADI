# Frontend en Vue

Frontend del concesionario (Vue 3 + Vite + Pinia + Vue Router + PrimeVue), conectado al backend de Supabase de la práctica 1. Las instrucciones completas (preparar Supabase, usuarios de prueba, datos de ejemplo, repetir las pruebas) están en el [README de la raíz](../README.md).

```bash
npm install
cp .env.example .env      # VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (solo la clave pública)
npm run dev               # http://localhost:5173
npm test                  # 25 archivos, 376 tests
npm run build
```

## Organización de `src/`

```
servicios/     copia de la capa de servicios de la práctica 1 (lib, validation, services): único acceso al backend
stores/        estado compartido (Pinia): sesion, coches, marcas
views/         una vista por ruta: Listado, Detalle, FormularioCoche (crear y editar), Login, Registro, SinPermiso, NoEncontrado
components/    piezas reutilizables: CocheCard, FiltrosCoches, FormularioCoche, GaleriaFotos, GestorFotos, EstadoCarga
composables/   lógica reutilizable con estado: useConfirmacion, useNotificaciones, useEliminarCoche, useGestionFotos, useVolverAlListado
router/        rutas y guardia de acceso por rol
utils/         funciones puras: errores, formato, filtros (URL), cambios (diferencias al editar)
App.vue        cabecera (sesión), avisos, diálogos de confirmación y la vista actual
```

La descripción detallada (responsabilidades, estado compartido, navegación y decisiones) está en `docs/ARCHITECTURE.md`.
