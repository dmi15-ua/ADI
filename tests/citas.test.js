import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { crearCliente } from '../src/lib/supabaseClient.js'
import { crearMarca } from '../src/services/marcaService.js'
import { crearCoche } from '../src/services/cocheService.js'
import { solicitarCita, listarMisCitas, cancelarCita } from '../src/services/citaService.js'
import { clienteAdmin } from './helpers/clientes.js'
import { crearUsuarioAutenticado, crearAdminAutenticado, borrarUsuarios } from './helpers/usuarios.js'

const idsUsuarios = []
const idsMarcas = []
let admin, A, B, marca

const nombreMarcaUnico = () => `Marca${Date.now()}${Math.floor(Math.random() * 1e6)}`
// Cada test crea su propio coche, así las citas de unos tests no chocan con las de otros
const nuevoCoche = (extra = {}) =>
  crearCoche(
    {
      marca_id: marca.id,
      modelo: 'Ateca',
      precio: 21000,
      km: 40000,
      anio: 2021,
      combustible: 'gasolina',
      transmision: 'manual',
      potencia_cv: 150,
      ...extra
    },
    admin.cliente
  )

// Una hora redonda dentro de 7 días; en(15) es 15 minutos después
const BASE = new Date(Date.now() + 7 * 24 * 3600 * 1000)
BASE.setMinutes(0, 0, 0)
const en = (minutos) => new Date(BASE.getTime() + minutos * 60_000)

beforeAll(async () => {
  admin = await crearAdminAutenticado('concesionario')
  A = await crearUsuarioAutenticado('clientea')
  B = await crearUsuarioAutenticado('clienteb')
  idsUsuarios.push(admin.usuario.id, A.usuario.id, B.usuario.id)
  marca = await crearMarca({ nombre: nombreMarcaUnico() }, admin.cliente)
  idsMarcas.push(marca.id)
})

afterAll(async () => {
  const db = clienteAdmin()
  await db.from('coche').delete().in('marca_id', idsMarcas) // borra también sus citas (cascade)
  await db.from('marca').delete().in('id', idsMarcas)
  await borrarUsuarios(idsUsuarios)
})

describe('solicitar cita', () => {
  it('un cliente solicita una cita pendiente de 30 minutos', async () => {
    const coche = await nuevoCoche()
    const cita = await solicitarCita({ coche_id: coche.id, inicio: en(0), nota_cliente: 'Prefiero por la tarde' }, A.cliente)
    expect(cita.id).toBeTypeOf('number')
    expect(cita.usuario_id).toBe(A.usuario.id)
    expect(cita.coche_id).toBe(coche.id)
    expect(cita.estado).toBe('pendiente')
    expect(new Date(cita.fin) - new Date(cita.inicio)).toBe(30 * 60_000)
    expect(cita.nota_cliente).toBe('Prefiero por la tarde')
  })

  it('acepta la fecha como texto ISO y la nota es opcional', async () => {
    const coche = await nuevoCoche()
    const cita = await solicitarCita({ coche_id: coche.id, inicio: en(0).toISOString() }, A.cliente)
    expect(new Date(cita.inicio).getTime()).toBe(en(0).getTime())
    expect(cita.nota_cliente).toBeNull()
  })

  it('un usuario sin sesión no puede solicitar citas', async () => {
    const coche = await nuevoCoche()
    await expect(solicitarCita({ coche_id: coche.id, inicio: en(0) }, crearCliente())).rejects.toThrow(/iniciar sesión/)
  })

  it('falla si el coche no existe', async () => {
    await expect(solicitarCita({ coche_id: 999999999, inicio: en(0) }, A.cliente)).rejects.toThrow('Coche no encontrado')
  })

  it('falla si el coche no está disponible', async () => {
    const coche = await nuevoCoche({ disponible: false })
    await expect(solicitarCita({ coche_id: coche.id, inicio: en(0) }, A.cliente)).rejects.toThrow(/no está disponible/)
  })

  const invalidos = [
    ['fecha en el pasado', (c) => ({ coche_id: c.id, inicio: new Date(Date.now() - 3600_000) }), /futuro/],
    ['fecha no válida', (c) => ({ coche_id: c.id, inicio: 'mañana' }), /fecha de inicio/i],
    ['sin fecha', (c) => ({ coche_id: c.id }), /fecha de inicio/i],
    ['nota demasiado larga', (c) => ({ coche_id: c.id, inicio: en(0), nota_cliente: 'x'.repeat(501) }), /nota/i],
    ['coche_id no numérico', () => ({ coche_id: 'abc', inicio: en(0) }), /coche/i],
    ['no se puede indicar el usuario', (c) => ({ coche_id: c.id, inicio: en(0), usuario_id: B.usuario.id }), /usuario_id/],
    ['no se puede indicar el estado', (c) => ({ coche_id: c.id, inicio: en(0), estado: 'confirmada' }), /estado/]
  ]
  it.each(invalidos)('rechaza datos no válidos: %s', async (_nombre, crearDatos, patron) => {
    const coche = await nuevoCoche()
    await expect(solicitarCita(crearDatos(coche), A.cliente)).rejects.toThrow(patron)
  })
})

describe('solapamiento de citas', () => {
  it('dos citas a la misma hora para el mismo coche se rechazan', async () => {
    const coche = await nuevoCoche()
    await solicitarCita({ coche_id: coche.id, inicio: en(0) }, A.cliente)
    await expect(solicitarCita({ coche_id: coche.id, inicio: en(0) }, B.cliente)).rejects.toThrow(/ya existe una cita/)
  })

  it('un solapamiento parcial también se rechaza', async () => {
    const coche = await nuevoCoche()
    await solicitarCita({ coche_id: coche.id, inicio: en(0) }, A.cliente)
    await expect(solicitarCita({ coche_id: coche.id, inicio: en(15) }, B.cliente)).rejects.toThrow(/ya existe una cita/)
    await expect(solicitarCita({ coche_id: coche.id, inicio: en(-15) }, B.cliente)).rejects.toThrow(/ya existe una cita/)
  })

  it('citas consecutivas (una termina cuando empieza la otra) son válidas', async () => {
    const coche = await nuevoCoche()
    await solicitarCita({ coche_id: coche.id, inicio: en(0) }, A.cliente)
    const siguiente = await solicitarCita({ coche_id: coche.id, inicio: en(30) }, B.cliente)
    expect(siguiente.estado).toBe('pendiente')
  })

  it('la misma hora en coches distintos es válida', async () => {
    const coche1 = await nuevoCoche()
    const coche2 = await nuevoCoche()
    await solicitarCita({ coche_id: coche1.id, inicio: en(0) }, A.cliente)
    const cita = await solicitarCita({ coche_id: coche2.id, inicio: en(0) }, B.cliente)
    expect(cita.coche_id).toBe(coche2.id)
  })

  it('una cita cancelada libera el horario', async () => {
    const coche = await nuevoCoche()
    const cita = await solicitarCita({ coche_id: coche.id, inicio: en(0) }, A.cliente)
    await cancelarCita(cita.id, A.cliente)
    const nueva = await solicitarCita({ coche_id: coche.id, inicio: en(0) }, B.cliente)
    expect(nueva.estado).toBe('pendiente')
  })
})

describe('listar mis citas', () => {
  it('cada usuario ve solo sus citas, ordenadas por fecha, con datos del coche', async () => {
    const coche1 = await nuevoCoche({ modelo: 'Leon' })
    const coche2 = await nuevoCoche({ modelo: 'Arona' })
    await solicitarCita({ coche_id: coche1.id, inicio: en(120) }, A.cliente)
    await solicitarCita({ coche_id: coche2.id, inicio: en(60) }, A.cliente)
    const deB = await solicitarCita({ coche_id: coche1.id, inicio: en(0) }, B.cliente)

    const citasA = await listarMisCitas(A.cliente)
    const propias = citasA.filter((c) => [coche1.id, coche2.id].includes(c.coche_id))
    expect(propias.map((c) => c.coche.modelo)).toEqual(['Arona', 'Leon'])
    expect(propias[0].coche.marca.nombre).toBe(marca.nombre)
    expect(citasA.every((c) => c.usuario_id === A.usuario.id)).toBe(true)
    expect(citasA.some((c) => c.id === deB.id)).toBe(false)

    const citasB = await listarMisCitas(B.cliente)
    expect(citasB.some((c) => c.id === deB.id)).toBe(true)
    expect(citasB.every((c) => c.usuario_id === B.usuario.id)).toBe(true)
  })

  it('un usuario sin citas recibe una lista vacía', async () => {
    const nuevo = await crearUsuarioAutenticado('sincitas')
    idsUsuarios.push(nuevo.usuario.id)
    expect(await listarMisCitas(nuevo.cliente)).toEqual([])
  })

  it('un usuario sin sesión no puede listar citas', async () => {
    await expect(listarMisCitas(crearCliente())).rejects.toThrow(/iniciar sesión/)
  })
})

describe('cancelar cita', () => {
  it('un usuario cancela su cita', async () => {
    const coche = await nuevoCoche()
    const cita = await solicitarCita({ coche_id: coche.id, inicio: en(0) }, A.cliente)
    const cancelada = await cancelarCita(cita.id, A.cliente)
    expect(cancelada.estado).toBe('cancelada')
    const propias = await listarMisCitas(A.cliente)
    expect(propias.find((c) => c.id === cita.id).estado).toBe('cancelada')
  })

  it('un usuario no puede cancelar la cita de otro', async () => {
    const coche = await nuevoCoche()
    const cita = await solicitarCita({ coche_id: coche.id, inicio: en(0) }, A.cliente)
    await expect(cancelarCita(cita.id, B.cliente)).rejects.toThrow(/sin permisos/)
    const { data } = await clienteAdmin().from('cita').select('estado').eq('id', cita.id).single()
    expect(data.estado).toBe('pendiente')
  })

  it('cancelar dos veces la misma cita falla la segunda', async () => {
    const coche = await nuevoCoche()
    const cita = await solicitarCita({ coche_id: coche.id, inicio: en(0) }, A.cliente)
    await cancelarCita(cita.id, A.cliente)
    await expect(cancelarCita(cita.id, A.cliente)).rejects.toThrow(/ya cancelada/)
  })

  it('falla si la cita no existe', async () => {
    await expect(cancelarCita(999999999, A.cliente)).rejects.toThrow(/no encontrada/)
  })

  it('falla si el id no es válido', async () => {
    await expect(cancelarCita('abc', A.cliente)).rejects.toThrow(/id/)
  })

  it('un usuario sin sesión no puede cancelar', async () => {
    await expect(cancelarCita(1, crearCliente())).rejects.toThrow(/iniciar sesión/)
  })
})

describe('seguridad en la BD (sin pasar por los servicios)', () => {
  const insertar = (cliente, fila) => cliente.from('cita').insert(fila).select()
  const fila = (coche, usuario, extra = {}) => ({
    coche_id: coche.id,
    usuario_id: usuario.id,
    inicio: en(0).toISOString(),
    fin: en(30).toISOString(),
    ...extra
  })

  it('no se puede crear una cita a nombre de otro usuario', async () => {
    const coche = await nuevoCoche()
    const { error } = await insertar(A.cliente, fila(coche, B.usuario))
    expect(error).not.toBeNull()
  })

  it('no se puede crear una cita ya confirmada', async () => {
    const coche = await nuevoCoche()
    const { error } = await insertar(A.cliente, fila(coche, A.usuario, { estado: 'confirmada' }))
    expect(error).not.toBeNull()
  })

  it('no se puede crear una cita en el pasado', async () => {
    const coche = await nuevoCoche()
    const pasado = new Date(Date.now() - 24 * 3600_000)
    const { error } = await insertar(
      A.cliente,
      fila(coche, A.usuario, { inicio: pasado.toISOString(), fin: new Date(pasado.getTime() + 30 * 60_000).toISOString() })
    )
    expect(error).not.toBeNull()
  })

  it('no se puede crear una cita para un coche no disponible', async () => {
    const coche = await nuevoCoche({ disponible: false })
    const { error } = await insertar(A.cliente, fila(coche, A.usuario))
    expect(error).not.toBeNull()
  })

  it('la duración debe ser de 30 minutos', async () => {
    const coche = await nuevoCoche()
    const { error } = await insertar(A.cliente, fila(coche, A.usuario, { fin: en(90).toISOString() }))
    expect(error).not.toBeNull()
  })

  it('un usuario sin sesión no puede insertar citas', async () => {
    const coche = await nuevoCoche()
    const { error } = await insertar(crearCliente(), fila(coche, A.usuario))
    expect(error).not.toBeNull()
  })

  it('el usuario no puede confirmar su propia cita', async () => {
    const coche = await nuevoCoche()
    const cita = await solicitarCita({ coche_id: coche.id, inicio: en(0) }, A.cliente)
    await A.cliente.from('cita').update({ estado: 'confirmada' }).eq('id', cita.id)
    const { data } = await clienteAdmin().from('cita').select('estado').eq('id', cita.id).single()
    expect(data.estado).toBe('pendiente')
  })

  it('el usuario no puede cambiar la fecha de su cita', async () => {
    const coche = await nuevoCoche()
    const cita = await solicitarCita({ coche_id: coche.id, inicio: en(0) }, A.cliente)
    const { error } = await A.cliente.from('cita').update({ inicio: en(600).toISOString() }).eq('id', cita.id)
    expect(error).not.toBeNull()
  })

  it('el usuario no puede borrar citas directamente', async () => {
    const coche = await nuevoCoche()
    const cita = await solicitarCita({ coche_id: coche.id, inicio: en(0) }, A.cliente)
    await A.cliente.from('cita').delete().eq('id', cita.id)
    const { data } = await clienteAdmin().from('cita').select('id').eq('id', cita.id)
    expect(data).toHaveLength(1)
  })
})

describe('borrado en cascada', () => {
  it('al eliminar un coche se eliminan sus citas', async () => {
    const coche = await nuevoCoche()
    const cita = await solicitarCita({ coche_id: coche.id, inicio: en(0) }, A.cliente)
    const db = clienteAdmin()
    await db.from('coche').delete().eq('id', coche.id)
    const { data } = await db.from('cita').select('id').eq('id', cita.id)
    expect(data).toEqual([])
  })
})
