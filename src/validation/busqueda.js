import { z } from 'zod'
import { COMBUSTIBLES, TRANSMISIONES } from './coche.js'

export const ORDENES = ['recientes', 'precio_asc', 'precio_desc', 'km_asc']
export const POR_PAGINA_MAXIMO = 50

export const busquedaSchema = z
  .object({
    marca_id: z.number('La marca debe ser un número').int().positive('La marca debe ser un id positivo').optional(),
    combustible: z.enum(COMBUSTIBLES, 'Combustible no válido').optional(),
    transmision: z.enum(TRANSMISIONES, 'Transmisión no válida').optional(),
    precio_min: z.number('precio_min debe ser un número').min(0, 'precio_min no puede ser negativo').optional(),
    precio_max: z.number('precio_max debe ser un número').min(0, 'precio_max no puede ser negativo').optional(),
    texto: z.string().trim().min(1, 'El texto de búsqueda no puede estar vacío').max(100).optional(),
    disponible: z.boolean().default(true),
    orden: z.enum(ORDENES, 'Orden no válido').default('recientes'),
    pagina: z.number('La página debe ser un número').int().min(1, 'La página debe ser un entero mayor o igual que 1').default(1),
    porPagina: z
      .number('porPagina debe ser un número')
      .int()
      .min(1, `porPagina debe estar entre 1 y ${POR_PAGINA_MAXIMO}`)
      .max(POR_PAGINA_MAXIMO, `porPagina debe estar entre 1 y ${POR_PAGINA_MAXIMO}`)
      .default(10)
  })
  .strict()
  .refine(
    (f) => f.precio_min === undefined || f.precio_max === undefined || f.precio_min <= f.precio_max,
    'precio_min no puede ser mayor que precio_max'
  )
