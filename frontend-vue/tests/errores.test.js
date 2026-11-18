import { describe, it, expect } from 'vitest'
import { mensajeDeError } from '../src/utils/errores.js'

describe('mensajeDeError', () => {
  it.each([
    ['Invalid login credentials', 'Email o contraseña incorrectos'],
    ['Email not confirmed', 'Todavía no has confirmado tu email'],
    ['Failed to fetch', 'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.'],
    ['JWT expired', 'Tu sesión ha caducado. Vuelve a iniciar sesión.'],
    ['User already registered', 'Ya existe una cuenta con ese email'],
    ['email rate limit exceeded', 'Demasiados intentos seguidos. Espera un momento e inténtalo de nuevo.'],
    ['Password should be at least 6 characters', 'La contraseña debe tener al menos 8 caracteres']
  ])('traduce «%s»', (original, esperado) => {
    expect(mensajeDeError(new Error(original))).toBe(esperado)
  })

  it('deja tal cual los mensajes que ya están en español (validación, permisos...)', () => {
    expect(mensajeDeError(new Error('No autorizado'))).toBe('No autorizado')
    expect(mensajeDeError(new Error('Coche no encontrado o sin permisos'))).toBe('Coche no encontrado o sin permisos')
  })

  it('acepta un texto', () => {
    expect(mensajeDeError('Failed to fetch')).toMatch(/No se pudo conectar/)
  })

  it('usa el mensaje por defecto si no hay información', () => {
    expect(mensajeDeError(undefined)).toBe('Ha ocurrido un error inesperado')
    expect(mensajeDeError(new Error(''), 'Fallo')).toBe('Fallo')
  })
})
