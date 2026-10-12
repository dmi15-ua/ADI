import { z } from 'zod'

export const COMBUSTIBLES = ['gasolina', 'diesel', 'electrico']
export const TRANSMISIONES = ['manual', 'automatico']

export const marcaSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre de la marca debe tener al menos 2 caracteres').max(50),
  pais: z.string().trim().min(2).max(50).optional()
})

const anioMaximo = () => new Date().getFullYear() + 1

export const cocheSchema = z.object({
  marca_id: z.number().int().positive('La marca es obligatoria'),
  modelo: z.string().trim().min(1, 'El modelo es obligatorio').max(100),
  precio: z.number('El precio debe ser un número').positive('El precio debe ser mayor que 0').max(10_000_000),
  km: z.number('El kilometraje debe ser un número').int('El kilometraje debe ser entero').min(0, 'El kilometraje no puede ser negativo'),
  anio: z.number('El año debe ser un número').int().min(1950, 'Año no válido').refine((a) => a <= anioMaximo(), 'Año no válido'),
  combustible: z.enum(COMBUSTIBLES, 'Combustible no válido'),
  transmision: z.enum(TRANSMISIONES, 'Transmisión no válida'),
  potencia_cv: z.number('La potencia debe ser un número').int().positive('La potencia debe ser mayor que 0').max(2000),
  descripcion: z.string().trim().max(2000).optional(),
  equipamiento: z.array(z.string().trim().min(1)).max(100).optional(),
  disponible: z.boolean().optional()
}).strict()

export const idSchema = z.coerce.number('El id debe ser un número').int('El id debe ser un número entero').positive('El id debe ser positivo')
