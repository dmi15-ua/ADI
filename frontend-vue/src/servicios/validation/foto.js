import { z } from 'zod'

export const fotoSchema = z
  .object({
    url: z
      .string('La URL es obligatoria')
      .trim()
      .max(2000, 'La URL es demasiado larga')
      .regex(/^https?:\/\/\S+$/, 'URL no válida (debe empezar por http:// o https://)'),
    orden: z.number('El orden debe ser un número').int('El orden debe ser entero').min(0, 'El orden no puede ser negativo').optional(),
    es_principal: z.boolean('es_principal debe ser verdadero o falso').optional()
  })
  .strict()
