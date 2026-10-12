import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { crearCliente } from '../src/lib/supabaseClient.js'
import { crearMarca, listarMarcas } from '../src/services/marcaService.js'
import { crearCoche, obtenerCoche } from '../src/services/cocheService.js'
import { clienteAdmin } from './helpers/clientes.js'
import { crearUsuarioAutenticado, crearAdminAutenticado, borrarUsuarios } from './helpers/usuarios.js'

const idsUsuarios = []
const idsMarcas = []
let admin, cliente, marca

const nombreMarcaUnico = () => `Marca${Date.now()}${Math.floor(Math.random() * 1e6)}`
const cocheValido = (extra = {}) => ({
  marca_id: marca.id,
  modelo: 'Golf',
  precio: 18500,
  km: 45000,
  anio: 2019,
  combustible: 'gasolina',
  transmision: 'manual',
  potencia_cv: 110,
  ...extra
})

beforeAll(async () => {
  admin = await crearAdminAutenticado('admin')
  cliente = await crearUsuarioAutenticado('cliente')
  idsUsuarios.push(admin.usuario.id, cliente.usuario.id)
  marca = await crearMarca({ nombre: nombreMarcaUnico(), pais: 'Alemania' }, admin.cliente)
  idsMarcas.push(marca.id)
})

afterAll(async () => {
  const db = clienteAdmin()
  await db.from('coche').delete().in('marca_id', idsMarcas) // borra también sus fotos (cascade)
  await db.from('marca').delete().in('id', idsMarcas)
  await borrarUsuarios(idsUsuarios)
})

describe('marcas', () => {
  it('un admin crea una marca', () => {
    expect(marca.id).toBeTypeOf('number')
    expect(marca.pais).toBe('Alemania')
  })

  it('rechaza una marca duplicada', async () => {
    await expect(crearMarca({ nombre: marca.nombre }, admin.cliente)).rejects.toThrow(/ya existe/)
  })

  it('rechaza un nombre de marca no válido', async () => {
    await expect(crearMarca({ nombre: 'A' }, admin.cliente)).rejects.toThrow(/marca/)
  })

  it('un cliente normal no puede crear marcas', async () => {
    await expect(crearMarca({ nombre: nombreMarcaUnico() }, cliente.cliente)).rejects.toThrow('No autorizado')
  })

  it('cualquiera (sin sesión) puede listar las marcas', async () => {
    const marcas = await listarMarcas(crearCliente())
    expect(marcas.some((m) => m.id === marca.id)).toBe(true)
  })
})

describe('crear coche', () => {
  it('un admin crea un coche con valores por defecto', async () => {
    const coche = await crearCoche(cocheValido({ equipamiento: ['Aire acondicionado', 'GPS'] }), admin.cliente)
    expect(coche.id).toBeTypeOf('number')
    expect(coche.modelo).toBe('Golf')
    expect(Number(coche.precio)).toBe(18500)
    expect(coche.disponible).toBe(true)
    expect(coche.equipamiento).toEqual(['Aire acondicionado', 'GPS'])
  })

  it('un cliente normal no puede crear coches', async () => {
    await expect(crearCoche(cocheValido(), cliente.cliente)).rejects.toThrow('No autorizado')
  })

  it('un usuario sin sesión no puede crear coches', async () => {
    await expect(crearCoche(cocheValido(), crearCliente())).rejects.toThrow('No autorizado')
  })

  const invalidos = [
    ['precio cero', { precio: 0 }, /precio/i],
    ['precio negativo', { precio: -100 }, /precio/i],
    ['precio no numérico', { precio: '100' }, /precio/i],
    ['km negativo', { km: -1 }, /kilometraje/i],
    ['año anterior a 1950', { anio: 1800 }, /Año/],
    ['año en el futuro lejano', { anio: 2999 }, /Año/],
    ['combustible inválido', { combustible: 'vapor' }, /Combustible/],
    ['transmisión inválida', { transmision: 'semi' }, /Transmisión/],
    ['potencia cero', { potencia_cv: 0 }, /potencia/i],
    ['modelo vacío', { modelo: '' }, /modelo/i],
    ['campo desconocido', { color: 'rojo' }, /color/]
  ]
  it.each(invalidos)('rechaza datos no válidos: %s', async (_nombre, extra, patron) => {
    await expect(crearCoche(cocheValido(extra), admin.cliente)).rejects.toThrow(patron)
  })

  it('rechaza un coche sin campos obligatorios', async () => {
    await expect(crearCoche({ modelo: 'Solo modelo' }, admin.cliente)).rejects.toThrow()
  })

  it('rechaza una marca que no existe', async () => {
    await expect(crearCoche(cocheValido({ marca_id: 999999999 }), admin.cliente)).rejects.toThrow(/no existe/)
  })

  it('la BD rechaza datos no válidos aunque se salte el servicio', async () => {
    const { error } = await clienteAdmin().from('coche').insert({ ...cocheValido(), precio: -5 })
    expect(error).not.toBeNull()
  })
})

describe('obtener coche', () => {
  let coche

  beforeAll(async () => {
    coche = await crearCoche(cocheValido({ modelo: 'Polo' }), admin.cliente)
    // Se indica es_principal en todas las filas: en un insert en lote, supabase-js pone a null las columnas ausentes
    const { error } = await clienteAdmin().from('foto_coche').insert([
      { coche_id: coche.id, url: 'https://ejemplo.com/2.jpg', orden: 2, es_principal: false },
      { coche_id: coche.id, url: 'https://ejemplo.com/1.jpg', orden: 1, es_principal: true }
    ])
    if (error) throw new Error(`No se pudieron insertar las fotos de prueba: ${error.message}`)
  })

  it('devuelve el coche con su marca y sus fotos ordenadas', async () => {
    const resultado = await obtenerCoche(coche.id, admin.cliente)
    expect(resultado.modelo).toBe('Polo')
    expect(resultado.marca.nombre).toBe(marca.nombre)
    expect(resultado.foto_coche.map((f) => f.orden)).toEqual([1, 2])
    expect(resultado.foto_coche[0].es_principal).toBe(true)
  })

  it('un visitante sin sesión puede ver la ficha', async () => {
    const resultado = await obtenerCoche(coche.id, crearCliente())
    expect(resultado.id).toBe(coche.id)
  })

  it('falla si el coche no existe', async () => {
    await expect(obtenerCoche(999999999, admin.cliente)).rejects.toThrow('Coche no encontrado')
  })

  it('falla si el id no es válido', async () => {
    await expect(obtenerCoche('abc', admin.cliente)).rejects.toThrow(/id/)
    await expect(obtenerCoche(-1, admin.cliente)).rejects.toThrow(/id/)
  })

  it('no admite dos fotos principales en el mismo coche', async () => {
    const { error } = await clienteAdmin()
      .from('foto_coche')
      .insert({ coche_id: coche.id, url: 'https://ejemplo.com/3.jpg', orden: 3, es_principal: true })
    expect(error).not.toBeNull()
    expect(error.code).toBe('23505') // violación del índice único de foto principal
  })
})
