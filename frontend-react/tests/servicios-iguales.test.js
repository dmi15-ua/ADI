import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Los servicios y utilidades que no dependen del framework se reutilizan del proyecto Vue como copia exacta.
// Este test avisa si alguna copia se queda desactualizada (solo se puede comprobar si los dos proyectos están en la misma carpeta).
const vue = resolve(__dirname, '../../frontend-vue/src')
const react = resolve(__dirname, '../src')
const archivos = [
  'servicios/lib/supabaseClient.js',
  'servicios/lib/errores.js',
  'servicios/lib/resumirCoche.js',
  'servicios/validation/coche.js',
  'servicios/validation/busqueda.js',
  'servicios/validation/usuario.js',
  'servicios/services/authService.js',
  'servicios/services/cocheService.js',
  'servicios/services/perfilService.js',
  'utils/errores.js',
  'utils/formato.js'
]

describe.skipIf(!existsSync(vue))('copias de los servicios del frontend en Vue', () => {
  it.each(archivos)('%s es idéntico al del proyecto Vue', (archivo) => {
    expect(readFileSync(resolve(react, archivo), 'utf8')).toBe(readFileSync(resolve(vue, archivo), 'utf8'))
  })
})

describe('copias de los servicios', () => {
  it.each(archivos)('%s existe', (archivo) => {
    expect(existsSync(resolve(react, archivo))).toBe(true)
  })
})
