import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import bcrypt from 'bcryptjs'
import { registrar, iniciarSesion } from './auth.service.js'
import { Usuario } from '../../models/Usuario.js'
import { verifyToken } from '../../lib/jwt.js'
import { AppError } from '../../lib/errors.js'
import { conectarMongoDePrueba, desconectarMongoDePrueba, limpiarColecciones } from '../../test/mongo.js'

beforeAll(conectarMongoDePrueba)
afterAll(desconectarMongoDePrueba)
afterEach(async () => {
  vi.restoreAllMocks()
  await limpiarColecciones()
})

describe('registrar', () => {
  it('guarda el password hasheado, nunca en texto plano', async () => {
    await registrar('Ana', 'ana@taju.co', 'clave-segura-123')

    const guardado = await Usuario.findOne({ email: 'ana@taju.co' }).select('+password').lean()
    expect(guardado).not.toBeNull()
    expect(guardado!.password).not.toBe('clave-segura-123')
    expect(await bcrypt.compare('clave-segura-123', guardado!.password)).toBe(true)
  })

  it('retorna token valido y usuario sin el campo password', async () => {
    const { token, usuario } = await registrar('Ana', 'ana@taju.co', 'clave-segura-123')

    expect(usuario).not.toHaveProperty('password')
    expect(usuario).toMatchObject({ nombre: 'Ana', email: 'ana@taju.co', rol: 'cliente' })

    const payload = verifyToken(token)
    expect(payload).toMatchObject({ sub: usuario._id, email: 'ana@taju.co', rol: 'cliente' })
  })

  it('lanza AppError(409) si el email ya existe', async () => {
    await registrar('Ana', 'ana@taju.co', 'clave-segura-123')

    const intento = registrar('Otra Ana', 'ana@taju.co', 'otra-clave-456')
    await expect(intento).rejects.toBeInstanceOf(AppError)
    await expect(intento).rejects.toMatchObject({ status: 409 })
  })

  // dos registros simultaneos pasan el findOne antes de que alguno inserte: el indice unico es la ultima defensa
  it('traduce la colision E11000 a AppError(409)', async () => {
    await Usuario.create({ nombre: 'Ana', email: 'ana@taju.co', password: 'hash-cualquiera' })
    // findOne devuelve una Query (thenable); null alcanza porque el service solo hace await sobre ella
    vi.spyOn(Usuario, 'findOne').mockReturnValueOnce(null as never)

    const intento = registrar('Ana', 'ana@taju.co', 'clave-segura-123')
    await expect(intento).rejects.toMatchObject({ status: 409, message: 'El correo ya está registrado' })
  })
})

describe('iniciarSesion', () => {
  it('retorna un token valido con credenciales correctas', async () => {
    await registrar('Ana', 'ana@taju.co', 'clave-segura-123')

    const { token, usuario } = await iniciarSesion('ana@taju.co', 'clave-segura-123')

    expect(usuario).not.toHaveProperty('password')
    expect(verifyToken(token)).toMatchObject({ email: 'ana@taju.co', rol: 'cliente' })
  })

  it('da el mismo 401 si el email no existe o si la clave es incorrecta', async () => {
    await registrar('Ana', 'ana@taju.co', 'clave-segura-123')

    const sinUsuario = await iniciarSesion('nadie@taju.co', 'clave-segura-123').catch((e: unknown) => e)
    const claveMala = await iniciarSesion('ana@taju.co', 'clave-equivocada').catch((e: unknown) => e)

    expect(sinUsuario).toBeInstanceOf(AppError)
    expect(claveMala).toBeInstanceOf(AppError)
    expect((sinUsuario as AppError).status).toBe(401)
    expect((claveMala as AppError).status).toBe(401)
    // mismo texto exacto: si difieren, el mensaje delata cual campo fallo
    expect((sinUsuario as AppError).message).toBe((claveMala as AppError).message)
  })
})
