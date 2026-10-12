import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { crearCliente } from '../src/lib/supabaseClient.js'
import { crearMarca } from '../src/services/marcaService.js'
import { crearCoche } from '../src/services/cocheService.js'
import { anadirFavorito, listarFavoritos, quitarFavorito } from '../src/services/favoritoService.js'
import { clienteAdmin } from './helpers/clientes.js'
import { crearUsuarioAutenticado, crearAdminAutenticado, borrarUsuarios } from './helpers/usuarios.js'

const idsUsuarios = []
const idsMarcas = []
let admin, A, B, marca

const nombreMarcaUnico = () => `Marca${Date.now()}${Math.floor(Math.random() * 1e6)}`
// Cada test crea sus propios coches para ser independiente de los demás
const nuevoCoche = (extra = {}) =>
  crearCoche(
    {
      marca_id: marca.id,
      modelo: 'Kuga',
      precio: 25000,
      km: 30000,
      anio: 2020,
      combustible: 'diesel',
      transmision: 'automatico',
      potencia_cv: 150,
      ...extra
    },
    admin.cliente
  )
const idsFavoritos = (lista) => lista.map((f) => f.coche.id)

beforeAll(async () => {
  admin = await crearAdminAutenticado('catalogo')
  A = await crearUsuarioAutenticado('favoritoa')
  B = await crearUsuarioAutenticado('favoritob')
  idsUsuarios.push(admin.usuario.id, A.usuario.id, B.usuario.id)
  marca = await crearMarca({ nombre: nombreMarcaUnico() }, admin.cliente)
  idsMarcas.push(marca.id)
})

afterAll(async () => {
  const db = clienteAdmin()
  await db.from('coche').delete().in('marca_id', idsMarcas) // borra también sus favoritos (cascade)
  await db.from('marca').delete().in('id', idsMarcas)
  await borrarUsuarios(idsUsuarios)
})

describe('añadir favorito', () => {
  it('un usuario guarda un coche como favorito', async () => {
    const coche = await nuevoCoche()
    const favorito = await anadirFavorito(coche.id, A.cliente)
    expect(favorito.usuario_id).toBe(A.usuario.id)
    expect(favorito.coche_id).toBe(coche.id)
    expect(favorito.fecha_guardado).toBeTruthy()
  })

  it('se puede guardar un coche no disponible', async () => {
    const coche = await nuevoCoche({ disponible: false })
    const favorito = await anadirFavorito(coche.id, A.cliente)
    expect(favorito.coche_id).toBe(coche.id)
  })

  it('no se puede guardar dos veces el mismo coche', async () => {
    const coche = await nuevoCoche()
    await anadirFavorito(coche.id, A.cliente)
    await expect(anadirFavorito(coche.id, A.cliente)).rejects.toThrow(/ya está en tus favoritos/)
  })

  it('dos usuarios pueden guardar el mismo coche', async () => {
    const coche = await nuevoCoche()
    await anadirFavorito(coche.id, A.cliente)
    const deB = await anadirFavorito(coche.id, B.cliente)
    expect(deB.usuario_id).toBe(B.usuario.id)
  })

  it('un usuario sin sesión no puede guardar favoritos', async () => {
    const coche = await nuevoCoche()
    await expect(anadirFavorito(coche.id, crearCliente())).rejects.toThrow(/iniciar sesión/)
  })

  it('falla si el coche no existe', async () => {
    await expect(anadirFavorito(999999999, A.cliente)).rejects.toThrow('Coche no encontrado')
  })

  it('falla si el id no es válido', async () => {
    await expect(anadirFavorito('abc', A.cliente)).rejects.toThrow(/id/)
    await expect(anadirFavorito(-3, A.cliente)).rejects.toThrow(/id/)
  })
})

describe('listar favoritos', () => {
  it('devuelve los favoritos del usuario, del más reciente al más antiguo, con marca y foto principal', async () => {
    const primero = await nuevoCoche({ modelo: 'Primero' })
    const segundo = await nuevoCoche({ modelo: 'Segundo' })
    const { error } = await clienteAdmin()
      .from('foto_coche')
      .insert({ coche_id: segundo.id, url: 'https://ejemplo.com/segundo.jpg', orden: 0, es_principal: true })
    expect(error).toBeNull()

    await anadirFavorito(primero.id, A.cliente)
    await anadirFavorito(segundo.id, A.cliente)

    const lista = await listarFavoritos(A.cliente)
    const ids = idsFavoritos(lista)
    expect(ids.indexOf(segundo.id)).toBeLessThan(ids.indexOf(primero.id))

    const favoritoSegundo = lista.find((f) => f.coche.id === segundo.id)
    expect(favoritoSegundo.coche.modelo).toBe('Segundo')
    expect(favoritoSegundo.coche.marca.nombre).toBe(marca.nombre)
    expect(favoritoSegundo.coche.foto_principal).toBe('https://ejemplo.com/segundo.jpg')
    expect(favoritoSegundo.coche.foto_coche).toBeUndefined()
    expect(favoritoSegundo.fecha_guardado).toBeTruthy()

    const favoritoPrimero = lista.find((f) => f.coche.id === primero.id)
    expect(favoritoPrimero.coche.foto_principal).toBeNull()
  })

  it('un usuario no ve los favoritos de otro', async () => {
    const coche = await nuevoCoche()
    await anadirFavorito(coche.id, A.cliente)
    const listaB = await listarFavoritos(B.cliente)
    expect(idsFavoritos(listaB)).not.toContain(coche.id)
  })

  it('un usuario sin favoritos recibe una lista vacía', async () => {
    const nuevo = await crearUsuarioAutenticado('sinfavoritos')
    idsUsuarios.push(nuevo.usuario.id)
    expect(await listarFavoritos(nuevo.cliente)).toEqual([])
  })

  it('un usuario sin sesión no puede listar favoritos', async () => {
    await expect(listarFavoritos(crearCliente())).rejects.toThrow(/iniciar sesión/)
  })
})

describe('quitar favorito', () => {
  it('un usuario quita un favorito y desaparece de su lista', async () => {
    const coche = await nuevoCoche()
    await anadirFavorito(coche.id, A.cliente)
    await quitarFavorito(coche.id, A.cliente)
    expect(idsFavoritos(await listarFavoritos(A.cliente))).not.toContain(coche.id)
  })

  it('después de quitarlo se puede volver a guardar', async () => {
    const coche = await nuevoCoche()
    await anadirFavorito(coche.id, A.cliente)
    await quitarFavorito(coche.id, A.cliente)
    const otraVez = await anadirFavorito(coche.id, A.cliente)
    expect(otraVez.coche_id).toBe(coche.id)
  })

  it('un usuario no puede quitar el favorito de otro', async () => {
    const coche = await nuevoCoche()
    await anadirFavorito(coche.id, A.cliente)
    await expect(quitarFavorito(coche.id, B.cliente)).rejects.toThrow(/no está en tus favoritos/)
    expect(idsFavoritos(await listarFavoritos(A.cliente))).toContain(coche.id)
  })

  it('quitar dos veces el mismo favorito falla la segunda', async () => {
    const coche = await nuevoCoche()
    await anadirFavorito(coche.id, A.cliente)
    await quitarFavorito(coche.id, A.cliente)
    await expect(quitarFavorito(coche.id, A.cliente)).rejects.toThrow(/no está en tus favoritos/)
  })

  it('falla si el coche nunca fue favorito', async () => {
    const coche = await nuevoCoche()
    await expect(quitarFavorito(coche.id, A.cliente)).rejects.toThrow(/no está en tus favoritos/)
  })

  it('falla si el id no es válido', async () => {
    await expect(quitarFavorito('abc', A.cliente)).rejects.toThrow(/id/)
  })

  it('un usuario sin sesión no puede quitar favoritos', async () => {
    await expect(quitarFavorito(1, crearCliente())).rejects.toThrow(/iniciar sesión/)
  })
})

describe('seguridad en la BD (sin pasar por los servicios)', () => {
  it('no se puede guardar un favorito a nombre de otro usuario', async () => {
    const coche = await nuevoCoche()
    const { error } = await A.cliente.from('favorito').insert({ usuario_id: B.usuario.id, coche_id: coche.id })
    expect(error).not.toBeNull()
  })

  it('no se pueden leer los favoritos de otro usuario', async () => {
    const coche = await nuevoCoche()
    await anadirFavorito(coche.id, B.cliente)
    const { data } = await A.cliente.from('favorito').select('*').eq('usuario_id', B.usuario.id)
    expect(data).toEqual([])
  })

  it('no se pueden borrar los favoritos de otro usuario', async () => {
    const coche = await nuevoCoche()
    await anadirFavorito(coche.id, B.cliente)
    await A.cliente.from('favorito').delete().eq('usuario_id', B.usuario.id).eq('coche_id', coche.id)
    const { data } = await clienteAdmin().from('favorito').select('*').eq('coche_id', coche.id)
    expect(data).toHaveLength(1)
  })

  it('un usuario sin sesión no puede insertar ni leer favoritos', async () => {
    const coche = await nuevoCoche()
    const anonimo = crearCliente()
    const { error } = await anonimo.from('favorito').insert({ usuario_id: A.usuario.id, coche_id: coche.id })
    expect(error).not.toBeNull()
    const lectura = await anonimo.from('favorito').select('*')
    expect(lectura.error).not.toBeNull()
  })
})

describe('borrado en cascada', () => {
  it('al eliminar un coche se eliminan sus favoritos', async () => {
    const coche = await nuevoCoche()
    await anadirFavorito(coche.id, A.cliente)
    const db = clienteAdmin()
    await db.from('coche').delete().eq('id', coche.id)
    const { data } = await db.from('favorito').select('*').eq('coche_id', coche.id)
    expect(data).toEqual([])
  })

  it('al eliminar un usuario se eliminan sus favoritos', async () => {
    const temporal = await crearUsuarioAutenticado('temporal')
    const coche = await nuevoCoche()
    await anadirFavorito(coche.id, temporal.cliente)
    const db = clienteAdmin()
    await db.auth.admin.deleteUser(temporal.usuario.id)
    const { data } = await db.from('favorito').select('*').eq('usuario_id', temporal.usuario.id)
    expect(data).toEqual([])
  })
})
