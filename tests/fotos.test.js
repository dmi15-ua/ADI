import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { crearCliente } from '../src/lib/supabaseClient.js'
import { crearMarca } from '../src/services/marcaService.js'
import { crearCoche, obtenerCoche, buscarCoches } from '../src/services/cocheService.js'
import { listarFotos, anadirFoto, eliminarFoto } from '../src/services/fotoService.js'
import { clienteAdmin } from './helpers/clientes.js'
import { crearUsuarioAutenticado, crearAdminAutenticado, borrarUsuarios } from './helpers/usuarios.js'

const idsUsuarios = []
const idsMarcas = []
let admin, cliente, marca

const nombreMarcaUnico = () => `Marca${Date.now()}${Math.floor(Math.random() * 1e6)}`
// Cada test crea su propio coche para ser independiente de los demás
const nuevoCoche = () =>
  crearCoche(
    {
      marca_id: marca.id,
      modelo: 'Clio',
      precio: 9000,
      km: 90000,
      anio: 2016,
      combustible: 'diesel',
      transmision: 'manual',
      potencia_cv: 90
    },
    admin.cliente
  )
const url = (n) => `https://ejemplo.com/foto-${n}.jpg`

beforeAll(async () => {
  admin = await crearAdminAutenticado('fotografo')
  cliente = await crearUsuarioAutenticado('cliente')
  idsUsuarios.push(admin.usuario.id, cliente.usuario.id)
  marca = await crearMarca({ nombre: nombreMarcaUnico() }, admin.cliente)
  idsMarcas.push(marca.id)
})

afterAll(async () => {
  const db = clienteAdmin()
  await db.from('coche').delete().in('marca_id', idsMarcas) // borra también sus fotos (cascade)
  await db.from('marca').delete().in('id', idsMarcas)
  await borrarUsuarios(idsUsuarios)
})

describe('añadir foto', () => {
  it('un admin añade una foto con valores por defecto', async () => {
    const coche = await nuevoCoche()
    const foto = await anadirFoto(coche.id, { url: url(1) }, admin.cliente)
    expect(foto.id).toBeTypeOf('number')
    expect(foto.coche_id).toBe(coche.id)
    expect(foto.url).toBe(url(1))
    expect(foto.orden).toBe(0)
    expect(foto.es_principal).toBe(false)
  })

  it('si no se indica orden, la foto va al final', async () => {
    const coche = await nuevoCoche()
    await anadirFoto(coche.id, { url: url(1) }, admin.cliente)
    const segunda = await anadirFoto(coche.id, { url: url(2) }, admin.cliente)
    const tercera = await anadirFoto(coche.id, { url: url(3) }, admin.cliente)
    expect(segunda.orden).toBe(1)
    expect(tercera.orden).toBe(2)
  })

  it('respeta el orden indicado', async () => {
    const coche = await nuevoCoche()
    const foto = await anadirFoto(coche.id, { url: url(1), orden: 7 }, admin.cliente)
    expect(foto.orden).toBe(7)
  })

  it('al marcar una foto como principal, la anterior deja de serlo', async () => {
    const coche = await nuevoCoche()
    await anadirFoto(coche.id, { url: url(1), es_principal: true }, admin.cliente)
    await anadirFoto(coche.id, { url: url(2), es_principal: true }, admin.cliente)
    const fotos = await listarFotos(coche.id, admin.cliente)
    const principales = fotos.filter((f) => f.es_principal)
    expect(principales).toHaveLength(1)
    expect(principales[0].url).toBe(url(2))
  })

  it('un cliente normal no puede añadir fotos', async () => {
    const coche = await nuevoCoche()
    await expect(anadirFoto(coche.id, { url: url(1) }, cliente.cliente)).rejects.toThrow('No autorizado')
  })

  it('un usuario sin sesión no puede añadir fotos', async () => {
    const coche = await nuevoCoche()
    await expect(anadirFoto(coche.id, { url: url(1) }, crearCliente())).rejects.toThrow('No autorizado')
  })

  it('un cliente no puede cambiar la foto principal de un coche', async () => {
    const coche = await nuevoCoche()
    await anadirFoto(coche.id, { url: url(1), es_principal: true }, admin.cliente)
    await expect(anadirFoto(coche.id, { url: url(2), es_principal: true }, cliente.cliente)).rejects.toThrow('No autorizado')
    const fotos = await listarFotos(coche.id, admin.cliente)
    expect(fotos.find((f) => f.es_principal).url).toBe(url(1))
  })

  it('falla si el coche no existe', async () => {
    await expect(anadirFoto(999999999, { url: url(1) }, admin.cliente)).rejects.toThrow('Coche no encontrado')
  })

  it('falla si el id del coche no es válido', async () => {
    await expect(anadirFoto('abc', { url: url(1) }, admin.cliente)).rejects.toThrow(/id/)
  })

  const invalidos = [
    ['URL sin http', { url: 'ejemplo.com/foto.jpg' }, /URL/],
    ['URL con otro protocolo', { url: 'javascript:alert(1)' }, /URL/],
    ['URL vacía', { url: '' }, /URL/],
    ['sin URL', {}, /URL/],
    ['orden negativo', { url: 'https://ejemplo.com/a.jpg', orden: -1 }, /orden/i],
    ['orden decimal', { url: 'https://ejemplo.com/a.jpg', orden: 1.5 }, /orden/i],
    ['es_principal no booleano', { url: 'https://ejemplo.com/a.jpg', es_principal: 'si' }, /es_principal/],
    ['campo desconocido (coche_id)', { url: 'https://ejemplo.com/a.jpg', coche_id: 1 }, /coche_id/]
  ]
  it.each(invalidos)('rechaza datos no válidos: %s', async (_nombre, datos, patron) => {
    const coche = await nuevoCoche()
    await expect(anadirFoto(coche.id, datos, admin.cliente)).rejects.toThrow(patron)
  })
})

describe('listar fotos', () => {
  it('devuelve las fotos ordenadas por orden', async () => {
    const coche = await nuevoCoche()
    await anadirFoto(coche.id, { url: url(3), orden: 3 }, admin.cliente)
    await anadirFoto(coche.id, { url: url(1), orden: 1 }, admin.cliente)
    await anadirFoto(coche.id, { url: url(2), orden: 2 }, admin.cliente)
    const fotos = await listarFotos(coche.id, admin.cliente)
    expect(fotos.map((f) => f.url)).toEqual([url(1), url(2), url(3)])
  })

  it('un visitante sin sesión puede ver las fotos', async () => {
    const coche = await nuevoCoche()
    await anadirFoto(coche.id, { url: url(1) }, admin.cliente)
    const fotos = await listarFotos(coche.id, crearCliente())
    expect(fotos).toHaveLength(1)
  })

  it('un coche sin fotos devuelve una lista vacía', async () => {
    const coche = await nuevoCoche()
    expect(await listarFotos(coche.id, admin.cliente)).toEqual([])
  })

  it('falla si el coche no existe', async () => {
    await expect(listarFotos(999999999, admin.cliente)).rejects.toThrow('Coche no encontrado')
  })

  it('falla si el id no es válido', async () => {
    await expect(listarFotos('abc', admin.cliente)).rejects.toThrow(/id/)
  })

  it('las fotos añadidas aparecen en la ficha del coche y como foto principal en la búsqueda', async () => {
    const coche = await nuevoCoche()
    await anadirFoto(coche.id, { url: url(1), orden: 2 }, admin.cliente)
    await anadirFoto(coche.id, { url: url(2), orden: 1, es_principal: true }, admin.cliente)
    const ficha = await obtenerCoche(coche.id, crearCliente())
    expect(ficha.foto_coche.map((f) => f.url)).toEqual([url(2), url(1)])
    const resultado = await buscarCoches({ marca_id: marca.id, texto: 'Clio', porPagina: 50 }, crearCliente())
    const encontrado = resultado.datos.find((c) => c.id === coche.id)
    expect(encontrado.foto_principal).toBe(url(2))
  })
})

describe('eliminar foto', () => {
  it('un admin elimina una foto y desaparece del listado', async () => {
    const coche = await nuevoCoche()
    const foto = await anadirFoto(coche.id, { url: url(1) }, admin.cliente)
    const otra = await anadirFoto(coche.id, { url: url(2) }, admin.cliente)
    await eliminarFoto(foto.id, admin.cliente)
    const fotos = await listarFotos(coche.id, admin.cliente)
    expect(fotos.map((f) => f.id)).toEqual([otra.id])
  })

  it('un cliente normal no puede eliminar y la foto sigue', async () => {
    const coche = await nuevoCoche()
    const foto = await anadirFoto(coche.id, { url: url(1) }, admin.cliente)
    await expect(eliminarFoto(foto.id, cliente.cliente)).rejects.toThrow(/sin permisos|No autorizado/)
    expect(await listarFotos(coche.id, admin.cliente)).toHaveLength(1)
  })

  it('un usuario sin sesión no puede eliminar', async () => {
    const coche = await nuevoCoche()
    const foto = await anadirFoto(coche.id, { url: url(1) }, admin.cliente)
    await expect(eliminarFoto(foto.id, crearCliente())).rejects.toThrow(/sin permisos|No autorizado/)
    expect(await listarFotos(coche.id, admin.cliente)).toHaveLength(1)
  })

  it('falla si la foto no existe', async () => {
    await expect(eliminarFoto(999999999, admin.cliente)).rejects.toThrow(/no encontrada/)
  })

  it('eliminar dos veces la misma foto falla la segunda', async () => {
    const coche = await nuevoCoche()
    const foto = await anadirFoto(coche.id, { url: url(1) }, admin.cliente)
    await eliminarFoto(foto.id, admin.cliente)
    await expect(eliminarFoto(foto.id, admin.cliente)).rejects.toThrow(/no encontrada/)
  })

  it('falla si el id no es válido', async () => {
    await expect(eliminarFoto('abc', admin.cliente)).rejects.toThrow(/id/)
  })

  it('al eliminar la foto principal se puede marcar otra como principal', async () => {
    const coche = await nuevoCoche()
    const principal = await anadirFoto(coche.id, { url: url(1), es_principal: true }, admin.cliente)
    await eliminarFoto(principal.id, admin.cliente)
    const nueva = await anadirFoto(coche.id, { url: url(2), es_principal: true }, admin.cliente)
    expect(nueva.es_principal).toBe(true)
  })
})
