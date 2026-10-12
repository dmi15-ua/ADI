import { z } from 'zod'

export const DURACION_CITA_MINUTOS = 30

export const citaSchema = z
  .object({
    coche_id: z.number('El coche debe ser un id numérico').int('El coche debe ser un id entero').positive('El coche debe ser un id positivo'),
    inicio: z
      .union([z.date(), z.string()], 'La fecha de inicio es obligatoria y debe ser una fecha')
      .refine((v) => !Number.isNaN(new Date(v).getTime()), 'Fecha de inicio no válida')
      .transform((v) => new Date(v))
      .refine((d) => d.getTime() > Date.now(), 'La cita debe ser en el futuro'),
    nota_cliente: z.string().trim().max(500, 'La nota no puede superar 500 caracteres').optional()
  })
  .strict()
