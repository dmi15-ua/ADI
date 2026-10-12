import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { crearCliente } from '../src/lib/supabaseClient.js'
import { registrar, login, logout } from '../src/services/authService.js'
import { obtenerPerfil, actualizarPerfil } from '../src/services/perfilService.js'
import { clienteAdmin } from './helpers/clientes.js'
import { crearUsuarioAutenticado, datosUsuarioUnico, borrarUsuarios } from './helpers/usuarios.js'

const idsCreados = []
let A, B

beforeAll(async () => {
  A = await crearUsuarioAutenticado('a')
  B = await crearUsuarioAutenticado('b')
  idsCreados.push(A.usuario.id, B.usuario.id)
})

afterAll(async () => {
  await borrarUsuarios(idsCreados)
})

describe('registro', () => {
  it('crea el usuario y su perfil con rol cliente', async () => {
    const { data } = await clienteAdmin().from('perfil').select('*').eq('id', A.usuario.id).single()
    expect(data.nombre).toBe(A.datos.nombre)
    expect(data.telefono).toBe(A.datos.telefono)
    expect(data.rol).toBe('cliente')
  })

  it('rechaza un email no válido', async () => {
    await expect(registrar({ ...datosUsuarioUnico(), email: 'no-es-email' }, crearCliente())).rejects.toThrow(/Email/)
  })

  it('rechaza una contraseña de menos de 8 caracteres', async () => {
    await expect(registrar({ ...datosUsuarioUnico(), password: '123' }, crearCliente())).rejects.toThrow(/contraseña/)
  })

  it('rechaza un nombre vacío', async () => {
    await expect(registrar({ ...datosUsuarioUnico(), nombre: '' }, crearCliente())).rejects.toThrow(/nombre/)
  })

  it('rechaza un teléfono no válido', async () => {
    await expect(registrar({ ...datosUsuarioUnico(), telefono: 'abc' }, crearCliente())).rejects.toThrow(/Teléfono/)
  })

  it('rechaza un email ya registrado', async () => {
    await expect(registrar(A.datos, crearCliente())).rejects.toThrow()
  })
})

describe('login', () => {
  it('con credenciales correctas devuelve un JWT', async () => {
    const { sesion } = await login({ email: A.datos.email, password: A.datos.password }, crearCliente())
    expect(sesion.access_token.split('.')).toHaveLength(3)
  })

  it('con contraseña incorrecta falla', async () => {
    await expect(login({ email: A.datos.email, password: 'incorrecta123' }, crearCliente())).rejects.toThrow()
  })
})

describe('obtener perfil', () => {
  it('un usuario ve su propio perfil', async () => {
    const perfil = await obtenerPerfil(A.usuario.id, A.cliente)
    expect(perfil.id).toBe(A.usuario.id)
    expect(perfil.nombre).toBe(A.datos.nombre)
  })

  it('un usuario no puede ver el perfil de otro', async () => {
    await expect(obtenerPerfil(B.usuario.id, A.cliente)).rejects.toThrow()
  })

  it('un usuario sin sesión no ve ningún perfil', async () => {
    await expect(obtenerPerfil(A.usuario.id, crearCliente())).rejects.toThrow()
  })
})

describe('editar perfil', () => {
  it('un usuario edita su nombre y teléfono', async () => {
    const perfil = await actualizarPerfil(A.usuario.id, { nombre: 'Nombre Nuevo', telefono: '699888777' }, A.cliente)
    expect(perfil.nombre).toBe('Nombre Nuevo')
    expect(perfil.telefono).toBe('699888777')
  })

  it('un usuario no puede editar el perfil de otro', async () => {
    await expect(actualizarPerfil(B.usuario.id, { nombre: 'Hackeado' }, A.cliente)).rejects.toThrow()
    const { data } = await clienteAdmin().from('perfil').select('nombre').eq('id', B.usuario.id).single()
    expect(data.nombre).toBe(B.datos.nombre)
  })

  it('rechaza datos no válidos', async () => {
    await expect(actualizarPerfil(A.usuario.id, { nombre: 'a' }, A.cliente)).rejects.toThrow(/nombre/)
    await expect(actualizarPerfil(A.usuario.id, { telefono: 'xx' }, A.cliente)).rejects.toThrow(/Teléfono/)
  })

  it('no permite cambiar el rol desde el servicio', async () => {
    await expect(actualizarPerfil(A.usuario.id, { rol: 'admin' }, A.cliente)).rejects.toThrow()
  })

  it('no permite cambiar el rol saltándose el servicio (RLS y permisos de columna)', async () => {
    const { error } = await A.cliente.from('perfil').update({ rol: 'admin' }).eq('id', A.usuario.id)
    expect(error).not.toBeNull()
  })
})

describe('logout', () => {
  it('tras cerrar sesión ya no se puede ver el perfil', async () => {
    const { cliente, usuario } = await crearUsuarioAutenticado('c')
    idsCreados.push(usuario.id)
    await logout(cliente)
    await expect(obtenerPerfil(usuario.id, cliente)).rejects.toThrow()
  })
})
