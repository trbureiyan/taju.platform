/**
 * Puebla taju-dev con categorias, productos y usuarios de muestra de las 4 familias
 * del catalogo. Idempotente via upsert con $setOnInsert: un documento que ya existe
 * (por nombre o email) nunca se sobreescribe.
 *
 * Uso: pnpm seed:dev [--yes] [--uri <mongodb+srv://...>]
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline/promises'
import bcrypt from 'bcryptjs'
import { Categoria } from '../../server/src/models/Categoria'
import { Producto } from '../../server/src/models/Producto'
import { Usuario } from '../../server/src/models/Usuario'
import { CATEGORIAS, PRODUCTOS, USUARIOS, PASSWORD_SEED } from './datos'

const SALT_ROUNDS = 12 // mismo costo que auth.service.ts

const args = process.argv.slice(2)
const yesExplicito = args.includes('--yes') || args.includes('-y')

function paso(n: number, texto: string): void {
  console.log(`\n[${n}/4] ${texto}`)
}

async function confirmar(pregunta: string): Promise<boolean> {
  if (yesExplicito) return true
  if (!process.stdin.isTTY) {
    console.error('    Sin --yes y sin entrada interactiva - no se aplica nada. Repetir con --yes para confirmar sin preguntar.')
    return false
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const r = (await rl.question(`${pregunta} [s/N] `)).trim().toLowerCase()
  rl.close()
  return r === 's' || r === 'si' || r === 'y'
}

function leerMongoUriDeEnv(envPath: string): string | undefined {
  for (const linea of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?MONGO_URI\s*=\s*(.*)$/.exec(linea)
    if (!m) continue
    const crudo = m[1].trim()
    const citado = /^(['"])(.*)\1$/.exec(crudo)
    const valor = citado ? citado[2] : crudo.replace(/\s+#.*$/, '')
    return valor || undefined
  }
  return undefined
}

/**
 * Destino en orden: --uri, MONGO_URI de la shell, MONGO_URI de server/.env.
 * @throws Error si --uri viene sin valor, o si no hay ningun destino disponible - a diferencia de
 * db-local, este script no tiene un default local: seedear sin saber exactamente que base se toca
 * es mas riesgoso aca porque si crea datos reales, no solo colecciones vacias.
 */
function resolverUri(): string {
  const i = args.indexOf('--uri')
  if (i !== -1) {
    const valor = args[i + 1]
    if (!valor || valor.startsWith('-')) throw new Error('--uri necesita una URI a continuacion')
    return valor
  }
  if (process.env.MONGO_URI) return process.env.MONGO_URI
  const envPath = resolve(__dirname, '../../server/.env')
  const deEnv = existsSync(envPath) ? leerMongoUriDeEnv(envPath) : undefined
  if (deEnv) return deEnv
  throw new Error('No hay MONGO_URI disponible (ni --uri, ni env de la shell, ni server/.env)')
}

// [!] guarda dura, sin flag de override: este script crea datos reales, nunca debe poder tocar taju-prod
function nombreDeBase(uri: string): string {
  const sinQuery = uri.split('?')[0]
  return sinQuery.slice(sinQuery.lastIndexOf('/') + 1)
}

async function main(): Promise<number> {
  paso(1, 'Destino')
  const uri = resolverUri()
  const visible = uri.replace(/\/\/[^@]*@/, '//***@')
  const base = nombreDeBase(uri)
  console.log(`    ${visible}`)
  console.log(`    base: "${base}"`)
  if (base === 'taju-prod') {
    console.error('    Destino es taju-prod. Este script no seedea produccion bajo ninguna circunstancia; abortado.')
    return 1
  }

  paso(2, 'Conexion')
  try {
    await Usuario.db.openUri(uri, { serverSelectionTimeoutMS: 4000 })
  } catch {
    console.error('    No se pudo conectar a ese destino.')
    return 1
  }
  console.log(`    OK, conectado a "${Usuario.db.name}"`)

  paso(3, 'Plan')
  const categoriasFaltantes = []
  for (const c of CATEGORIAS) {
    const existe = await Categoria.exists({ nombre: c.nombre })
    console.log(`    categoria  ${c.nombre.padEnd(28)} ${existe ? 'existe' : 'crear'}`)
    if (!existe) categoriasFaltantes.push(c.nombre)
  }
  for (const p of PRODUCTOS) {
    const existe = await Producto.exists({ nombre: p.nombre })
    console.log(`    producto   ${p.nombre.padEnd(28)} ${existe ? 'existe' : 'crear'}`)
  }
  for (const u of USUARIOS) {
    const existe = await Usuario.exists({ email: u.email })
    console.log(`    usuario    ${u.email.padEnd(28)} ${existe ? 'existe' : 'crear'}`)
  }
  if (!(await confirmar('    Aplicar?'))) {
    console.log('    Cancelado, sin cambios.')
    return 0
  }

  paso(4, 'Aplicando')
  const idsCategoria = new Map<string, string>()
  for (const c of CATEGORIAS) {
    const doc = await Categoria.findOneAndUpdate(
      { nombre: c.nombre },
      { $setOnInsert: c },
      { upsert: true, new: true },
    )
    idsCategoria.set(c.nombre, doc.id as string)
  }

  for (const p of PRODUCTOS) {
    const categoriaId = idsCategoria.get(p.categoriaNombre)
    if (!categoriaId) throw new Error(`Categoria "${p.categoriaNombre}" no encontrada para el producto "${p.nombre}"`)
    await Producto.findOneAndUpdate(
      { nombre: p.nombre },
      {
        $setOnInsert: {
          nombre: p.nombre,
          descripcionTecnica: p.descripcionTecnica,
          categoria: categoriaId,
          especificacionesTecnicas: p.especificacionesTecnicas,
          precio: p.precio,
        },
      },
      { upsert: true, new: true },
    )
  }

  const hash = await bcrypt.hash(PASSWORD_SEED, SALT_ROUNDS)
  for (const u of USUARIOS) {
    await Usuario.findOneAndUpdate(
      { email: u.email },
      { $setOnInsert: { nombre: u.nombre, email: u.email, rol: u.rol, password: hash } },
      { upsert: true, new: true },
    )
  }

  console.log('    Listo. Password de los usuarios de muestra: ver tools/seed-dev/datos.ts (PASSWORD_SEED).')
  return 0
}

main()
  .then((code) => (process.exitCode = code))
  .catch((err: unknown) => {
    console.error(err instanceof Error ? `    ${err.message}` : err)
    process.exitCode = 1
  })
  .finally(() => Usuario.db.close())
