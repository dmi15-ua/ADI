import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { crearCliente } from '../src/lib/supabaseClient.js'
import { crearMarca } from '../src/services/marcaService.js'
import { crearCoche, buscarCoches } from '../src/services/cocheService.js'
import { clienteAdmin } from './helpers/clientes.js'
import { crearAdminAutenticado, borrarUsuarios } from './helpers/usuarios.js'

const idsMarcas = []
let admin, marca1, marca2
const modelos = (resultado) => resultado.datos.map((c) => c.modelo)

const nombreMarcaUnico = () => `Marca${Date.now()}${Math.floor(Math.random() * 1e6)}`
const coche = (marca, modelo, combustible, transmision, precio, extra = {}) => ({
  marca_id: marca.id,
  modelo,
  precio,
  km: 30000,
  anio: 2020,
  combustible,
  transmision,
  potencia_cv: 100,
  ...extra
})

beforeAll(async () => {
  admin = await crearAdminAutenticado('buscador')
  marca1 = await crearMarca({ nombre: nombreMarcaUnico() }, admin.cliente)
  marca2 = await crearMarca({ nombre: nombreMarcaUnico() }, admin.cliente)
  idsMarcas.push(marca1.id, marca2.id)

  // Datos controlados. Las búsquedas filtran siempre por estas marcas para no depender del resto de la BD.
  const golf = await crearCoche(coche(marca1, 'Golf', 'gasolina', 'manual', 15000, { km: 80000 }), admin.cliente)
  await crearCoche(coche(marca1, 'Polo', 'diesel', 'manual', 12000, { km: 120000 }), admin.cliente)
  await crearCoche(coche(marca1, 'Leaf', 'electrico', 'automatico', 22000, { km: 20000 }), admin.cliente)
  await crearCoche(coche(marca1, 'Passat', 'diesel', 'automatico', 28000, { km: 60000 }), admin.cliente)
  await crearCoche(coche(marca1, 'Tiguan', 'gasolina', 'automatico', 35000, { disponible: false }), admin.cliente)
  await crearCoche(coche(marca2, 'Model 3', 'electrico', 'automatico', 40000), admin.cliente)

  const { error } = await clienteAdmin().from('foto_coche').insert([
    { coche_id: golf.id, url: 'https://ejemplo.com/golf-2.jpg', orden: 2, es_principal: false },
    { coche_id: golf.id, url: 'https://ejemplo.com/golf-1.jpg', orden: 1, es_principal: true }
  ])
  if (error) throw new Error(`No se pudieron insertar las fotos de prueba: ${error.message}`)
})

afterAll(async () => {
  const db = clienteAdmin()
  await db.from('coche').delete().in('marca_id', idsMarcas)
  await db.from('marca').delete().in('id', idsMarcas)
  await borrarUsuarios([admin.usuario.id])
})

describe('filtros', () => {
  it('por marca devuelve solo los coches disponibles de esa marca', async () => {
    const r = await buscarCoches({ marca_id: marca1.id, orden: 'precio_asc' })
    expect(modelos(r)).toEqual(['Polo', 'Golf', 'Leaf', 'Passat'])
    expect(r.total).toBe(4)
  })

  it('puede buscar los no disponibles', async () => {
    const r = await buscarCoches({ marca_id: marca1.id, disponible: false })
    expect(modelos(r)).toEqual(['Tiguan'])
  })

  it('por combustible', async () => {
    const r = await buscarCoches({ marca_id: marca1.id, combustible: 'diesel', orden: 'precio_asc' })
    expect(modelos(r)).toEqual(['Polo', 'Passat'])
  })

  it('por tipo de cambio', async () => {
    const r = await buscarCoches({ marca_id: marca1.id, transmision: 'automatico', orden: 'precio_asc' })
    expect(modelos(r)).toEqual(['Leaf', 'Passat'])
  })

  it('por rango de precio (mínimo y máximo incluidos)', async () => {
    const r = await buscarCoches({ marca_id: marca1.id, precio_min: 15000, precio_max: 22000, orden: 'precio_asc' })
    expect(modelos(r)).toEqual(['Golf', 'Leaf'])
  })

  it('solo con precio mínimo', async () => {
    const r = await buscarCoches({ marca_id: marca1.id, precio_min: 20000, orden: 'precio_asc' })
    expect(modelos(r)).toEqual(['Leaf', 'Passat'])
  })

  it('solo con precio máximo', async () => {
    const r = await buscarCoches({ marca_id: marca1.id, precio_max: 12000 })
    expect(modelos(r)).toEqual(['Polo'])
  })

  it('combinando varios filtros', async () => {
    const r = await buscarCoches({ marca_id: marca1.id, combustible: 'diesel', precio_max: 20000 })
    expect(modelos(r)).toEqual(['Polo'])
  })

  it('por texto en el modelo, sin distinguir mayúsculas', async () => {
    const r = await buscarCoches({ marca_id: marca1.id, texto: 'PAS' })
    expect(modelos(r)).toEqual(['Passat'])
  })

  it('el texto se busca literalmente (% y _ no son comodines)', async () => {
    expect(modelos(await buscarCoches({ marca_id: marca1.id, texto: '%' }))).toEqual([])
    expect(modelos(await buscarCoches({ marca_id: marca1.id, texto: '_' }))).toEqual([])
  })

  it('sin resultados devuelve una lista vacía', async () => {
    const r = await buscarCoches({ marca_id: marca1.id, combustible: 'electrico', precio_min: 30000 })
    expect(r.datos).toEqual([])
    expect(r.total).toBe(0)
    expect(r.totalPaginas).toBe(0)
  })

  it('cada resultado incluye su marca y la foto principal', async () => {
    const r = await buscarCoches({ marca_id: marca1.id, texto: 'Golf' })
    expect(r.datos[0].marca.nombre).toBe(marca1.nombre)
    expect(r.datos[0].foto_principal).toBe('https://ejemplo.com/golf-1.jpg')
    expect(r.datos[0].foto_coche).toBeUndefined()
  })

  it('un coche sin fotos tiene foto_principal null', async () => {
    const r = await buscarCoches({ marca_id: marca1.id, texto: 'Polo' })
    expect(r.datos[0].foto_principal).toBeNull()
  })

  it('un visitante sin sesión puede buscar', async () => {
    const r = await buscarCoches({ marca_id: marca2.id }, crearCliente())
    expect(modelos(r)).toEqual(['Model 3'])
  })
})

describe('orden', () => {
  it('por precio ascendente', async () => {
    const r = await buscarCoches({ marca_id: marca1.id, orden: 'precio_asc' })
    expect(r.datos.map((c) => Number(c.precio))).toEqual([12000, 15000, 22000, 28000])
  })

  it('por precio descendente', async () => {
    const r = await buscarCoches({ marca_id: marca1.id, orden: 'precio_desc' })
    expect(r.datos.map((c) => Number(c.precio))).toEqual([28000, 22000, 15000, 12000])
  })

  it('por kilometraje ascendente', async () => {
    const r = await buscarCoches({ marca_id: marca1.id, orden: 'km_asc' })
    expect(modelos(r)).toEqual(['Leaf', 'Passat', 'Golf', 'Polo'])
  })
})

describe('paginación', () => {
  const filtros = { marca_id: undefined, orden: 'precio_asc', porPagina: 2 }

  it('por defecto: página 1 y 10 por página', async () => {
    const r = await buscarCoches({ marca_id: marca1.id })
    expect(r.pagina).toBe(1)
    expect(r.porPagina).toBe(10)
  })

  it('devuelve el total y el número de páginas', async () => {
    const r = await buscarCoches({ ...filtros, marca_id: marca1.id })
    expect(r.datos).toHaveLength(2)
    expect(r.total).toBe(4)
    expect(r.totalPaginas).toBe(2)
  })

  it('las páginas no se solapan y juntas cubren todos los resultados', async () => {
    const p1 = await buscarCoches({ ...filtros, marca_id: marca1.id, pagina: 1 })
    const p2 = await buscarCoches({ ...filtros, marca_id: marca1.id, pagina: 2 })
    expect(modelos(p1)).toEqual(['Polo', 'Golf'])
    expect(modelos(p2)).toEqual(['Leaf', 'Passat'])
  })

  it('una página fuera de rango devuelve lista vacía pero mantiene el total', async () => {
    const r = await buscarCoches({ ...filtros, marca_id: marca1.id, pagina: 3 })
    expect(r.datos).toEqual([])
    expect(r.total).toBe(4)
  })

  it('la última página puede estar incompleta', async () => {
    const r = await buscarCoches({ marca_id: marca1.id, orden: 'precio_asc', porPagina: 3, pagina: 2 })
    expect(modelos(r)).toEqual(['Passat'])
    expect(r.totalPaginas).toBe(2)
  })
})

describe('validación de los filtros', () => {
  const invalidos = [
    ['página 0', { pagina: 0 }, /página/],
    ['página decimal', { pagina: 1.5 }, /página/],
    ['porPagina 0', { porPagina: 0 }, /porPagina/],
    ['porPagina mayor que 50', { porPagina: 51 }, /porPagina/],
    ['precio_min negativo', { precio_min: -1 }, /precio_min/],
    ['precio_min mayor que precio_max', { precio_min: 30000, precio_max: 10000 }, /precio_min/],
    ['combustible inválido', { combustible: 'vapor' }, /Combustible/],
    ['transmisión inválida', { transmision: 'semi' }, /Transmisión/],
    ['orden inválido', { orden: 'barato' }, /Orden/],
    ['texto vacío', { texto: '   ' }, /texto/],
    ['marca no numérica', { marca_id: 'audi' }, /marca/],
    ['filtro desconocido', { color: 'rojo' }, /color/]
  ]
  it.each(invalidos)('rechaza: %s', async (_nombre, filtros, patron) => {
    await expect(buscarCoches(filtros)).rejects.toThrow(patron)
  })
})
