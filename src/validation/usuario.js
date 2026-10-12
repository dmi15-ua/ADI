import { z } from 'zod'

const email = z.string().trim().email('Email no válido')
const password = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
const nombre = z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100)
const telefono = z
  .string()
  .regex(/^[0-9+ ]{9,15}$/, 'Teléfono no válido (9-15 dígitos, + y espacios)')

export const registroSchema = z.object({
  email,
  password,
  nombre,
  telefono: telefono.optional()
})

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'La contraseña es obligatoria')
})

// strict(): si llega un campo desconocido (por ejemplo "rol") se rechaza
export const actualizarPerfilSchema = z
  .object({
    nombre: nombre.optional(),
    telefono: telefono.nullable().optional()
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, 'No hay campos que actualizar')

export function validar(schema, datos) {
  const resultado = schema.safeParse(datos)
  if (!resultado.success) {
    throw new Error(resultado.error.issues.map((i) => i.message).join('; '))
  }
  return resultado.data
}
