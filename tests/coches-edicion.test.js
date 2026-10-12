import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { crearCliente } from '../src/lib/supabaseClient.js'
import { crearMarca } from '../src/services/marcaService.js'
import { crearCoche, obtenerCoche, actualizarCoche, eliminarCoche } from '../src/services/cocheService.js'
import { clienteAdmin } from './helpers/clientes.js'
import { crearUsuarioAutenticado, crearAdminAutenticado, borrarUsuarios } from './helpers/usuarios.js'

const idsUsuarios = []
const idsMarcas = []
let admin, cliente, marca, otraMarca

const nombreMarcaUnico = () => `Marca${Date.now()}${Math.floor(Math.random() * 1e6)}`
const datosCoche = (extra = {}) => ({
  marca_id: marca.id,
  modelo: 'Ibiza',
  precio: 14000,
  km: 50000,
  anio: 2018,
  combustible: 'gasolina',
  transmision: 'manual',
  potencia_cv: 95,
  ...extra
})
// Cada test crea su propio coche para ser independiente de los demás
const nuevoCoche = (extra) => crearCoche(datosCoche(extra), admin.cliente)

const SIN_PERMISOS = /sin permisos|No autorizado/

beforeAll(async () => {
  admin = await crearAdminAutenticado('editor')
  cliente = await crearUsuarioAutenticado('cliente')
  idsUsuarios.push(admin.usuario.id, cliente.usuario.id)
  marca = await crearMarca({ nombre: nombreMarcaUnico() }, admin.cliente)
  otraMarca = await crearMarca({ nombre: nombreMarcaUnico() }, admin.cliente)
  idsMarcas.push(marca.id, otraMarca.id)
})

afterAll(async () => {
  const db = clienteAdmin()
  await db.from('coche').delete().in('marca_id', idsMarcas)
  await db.from('marca').delete().in('id', idsMarcas)
  await borrarUsuarios(idsUsuarios)
})

describe('actualizar coche', () => {
  it('un admin cambia algunos campos y el resto se mantiene', async () => {
    const coche = await nuevoCoche()
    const actualizado = await actualizarCoche(coche.id, { precio: 12500, disponible: false }, admin.cliente)
    expect(Number(actualizado.precio)).toBe(12500)
    expect(actualizado.disponible).toBe(false)
    expect(actualizado.modelo).toBe('Ibiza')
    expect(actualizado.km).toBe(50000)
    const leido = await obtenerCoche(coche.id, admin.cliente)
    expect(Number(leido.precio)).toBe(12500)
  })

  it('un admin cambia descripción y equipamiento', async () => {
    const coche = await nuevoCoche()
    const actualizado = await actualizarCoche(
      coche.id,
      { descripcion: 'Único dueño', equipamiento: ['Bluetooth', 'Cámara trasera'] },
      admin.cliente
    )
    expect(actualizado.descripcion).toBe('Único dueño')
    expect(actualizado.equipamiento).toEqual(['Bluetooth', 'Cámara trasera'])
  })

  it('un admin cambia la marca del coche', async () => {
    const coche = await nuevoCoche()
    const actualizado = await actualizarCoche(coche.id, { marca_id: otraMarca.id }, admin.cliente)
    expect(actualizado.marca_id).toBe(otraMarca.id)
  })

  it('un cliente normal no puede editar y el coche no cambia', async () => {
    const coche = await nuevoCoche()
    await expect(actualizarCoche(coche.id, { precio: 1 }, cliente.cliente)).rejects.toThrow(SIN_PERMISOS)
    const { data } = await clienteAdmin().from('coche').select('precio').eq('id', coche.id).single()
    expect(Number(data.precio)).toBe(14000)
  })

  it('un usuario sin sesión no puede editar', async () => {
    const coche = await nuevoCoche()
    await expect(actualizarCoche(coche.id, { precio: 1 }, crearCliente())).rejects.toThrow(SIN_PERMISOS)
  })

  it('falla si el coche no existe', async () => {
    await expect(actualizarCoche(999999999, { precio: 100 }, admin.cliente)).rejects.toThrow(/no encontrado/)
  })

  it('falla si el id no es válido', async () => {
    await expect(actualizarCoche('abc', { precio: 100 }, admin.cliente)).rejects.toThrow(/id/)
    await expect(actualizarCoche(0, { precio: 100 }, admin.cliente)).rejects.toThrow(/id/)
  })

  const invalidos = [
    ['precio negativo', { precio: -1 }, /precio/i],
    ['km negativo', { km: -5 }, /kilometraje/i],
    ['año no válido', { anio: 1800 }, /Año/],
    ['combustible inválido', { combustible: 'vapor' }, /Combustible/],
    ['potencia cero', { potencia_cv: 0 }, /potencia/i],
    ['modelo vacío', { modelo: '' }, /modelo/i],
    ['objeto vacío', {}, /No hay campos/],
    ['campo que no se puede editar (id)', { id: 5 }, /id/],
    ['campo desconocido', { color: 'rojo' }, /color/]
  ]
  it.each(invalidos)('rechaza datos no válidos: %s', async (_nombre, cambios, patron) => {
    const coche = await nuevoCoche()
    await expect(actualizarCoche(coche.id, cambios, admin.cliente)).rejects.toThrow(patron)
  })

  it('rechaza una marca que no existe', async () => {
    const coche = await nuevoCoche()
    await expect(actualizarCoche(coche.id, { marca_id: 999999999 }, admin.cliente)).rejects.toThrow(/no existe/)
  })
})

describe('eliminar coche', () => {
  it('un admin elimina un coche y sus fotos', async () => {
    const coche = await nuevoCoche()
    const db = clienteAdmin()
    const { error } = await db
      .from('foto_coche')
      .insert({ coche_id: coche.id, url: 'https://ejemplo.com/a.jpg', orden: 1, es_principal: true })
    expect(error).toBeNull()

    await eliminarCoche(coche.id, admin.cliente)

    await expect(obtenerCoche(coche.id, admin.cliente)).rejects.toThrow('Coche no encontrado')
    const { data: fotos } = await db.from('foto_coche').select('id').eq('coche_id', coche.id)
    expect(fotos).toEqual([])
  })

  it('un cliente normal no puede eliminar y el coche sigue existiendo', async () => {
    const coche = await nuevoCoche()
    await expect(eliminarCoche(coche.id, cliente.cliente)).rejects.toThrow(SIN_PERMISOS)
    const existente = await obtenerCoche(coche.id, admin.cliente)
    expect(existente.id).toBe(coche.id)
  })

  it('un usuario sin sesión no puede eliminar', async () => {
    const coche = await nuevoCoche()
    await expect(eliminarCoche(coche.id, crearCliente())).rejects.toThrow(SIN_PERMISOS)
    const existente = await obtenerCoche(coche.id, admin.cliente)
    expect(existente.id).toBe(coche.id)
  })

  it('falla si el coche no existe', async () => {
    await expect(eliminarCoche(999999999, admin.cliente)).rejects.toThrow(/no encontrado/)
  })

  it('eliminar dos veces el mismo coche falla la segunda', async () => {
    const coche = await nuevoCoche()
    await eliminarCoche(coche.id, admin.cliente)
    await expect(eliminarCoche(coche.id, admin.cliente)).rejects.toThrow(/no encontrado/)
  })

  it('falla si el id no es válido', async () => {
    await expect(eliminarCoche('abc', admin.cliente)).rejects.toThrow(/id/)
  })
})
