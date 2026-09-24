/**
 * Prepara la base MongoDB local para desarrollo: crea las colecciones y los
 * indices que declaran los modelos de server/src/models. Idempotente: lo que
 * ya existe se deja como esta, nunca borra ni modifica datos.
 *
 * Uso: pnpm db:local [--yes] [--uri <mongodb://...>]
 */
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline/promises'
import type { Model } from 'mongoose'

// [DECISION] Modulo externo que importa los modelos del server en vez de duplicarlos — los indices siguen al schema sin mantenimiento. Si un modelo cambia de ruta, actualizar MODELOS.
import { Categoria } from '../../server/src/models/Categoria'
import { Pedido } from '../../server/src/models/Pedido'
import { Producto } from '../../server/src/models/Producto'
import { Usuario } from '../../server/src/models/Usuario'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MODELOS: Model<any>[] = [Categoria, Producto, Usuario, Pedido]
const URI_POR_DEFECTO = 'mongodb://127.0.0.1:27017/taju'
const HOSTS_LOCALES = ['localhost', '127.0.0.1', '::1', '[::1]', 'mongo', 'host.docker.internal']

const args = process.argv.slice(2)
const sinPreguntar = args.includes('--yes') || args.includes('-y') || !process.stdin.isTTY
const uriArg = args[args.indexOf('--uri') + 1]

function paso(n: number, texto: string): void {
  console.log(`\n[${n}/4] ${texto}`)
}

async function confirmar(pregunta: string): Promise<boolean> {
  if (sinPreguntar) return true
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const r = (await rl.question(`${pregunta} [s/N] `)).trim().toLowerCase()
  rl.close()
  return r === 's' || r === 'si' || r === 'y'
}

function resolverUri(): string {
  if (args.includes('--uri') && uriArg) return uriArg
  const envPath = resolve(__dirname, '../../server/.env')
  // loadEnvFile no pisa variables ya exportadas en la shell
  if (!process.env.MONGO_URI && existsSync(envPath)) process.loadEnvFile(envPath)
  return process.env.MONGO_URI ?? URI_POR_DEFECTO
}

// [!] guarda contra Atlas: este script es solo para local, un error de .env no debe tocar prod
function esLocal(uri: string): boolean {
  if (uri.startsWith('mongodb+srv://')) return false
  const host = uri.replace(/^mongodb:\/\//, '').replace(/^[^@]*@/, '').split(/[/?,]/)[0]
  return HOSTS_LOCALES.includes(host.replace(/:\d+$/, ''))
}

async function main(): Promise<number> {
  paso(1, 'Destino')
  const uri = resolverUri()
  const visible = uri.replace(/\/\/[^@]*@/, '//***@')
  console.log(`    ${visible}`)
  if (!esLocal(uri)) {
    console.error('    El destino no es local. Este script solo prepara bases locales; abortado.')
    return 1
  }

  paso(2, 'Conexion')
  const conn = Usuario.db
  try {
    await conn.openUri(uri, { serverSelectionTimeoutMS: 4000 })
  } catch {
    console.error('    No hay MongoDB escuchando en ese destino.')
    console.error('    Levantalo con: docker run -d --name taju-mongo -p 27017:27017 mongo:8')
    return 1
  }
  console.log(`    OK, base "${conn.name}"`)

  paso(3, 'Plan')
  const existentes = new Set((await conn.listCollections()).map((c) => c.name))
  const faltantes = MODELOS.filter((m) => !existentes.has(m.collection.collectionName))
  for (const m of MODELOS) {
    const estado = existentes.has(m.collection.collectionName) ? 'existe' : 'crear'
    console.log(`    ${m.collection.collectionName.padEnd(12)} ${estado}`)
  }
  console.log('    indices: se crean los que falten, los existentes no se tocan')
  if (!(await confirmar('    Aplicar?'))) {
    console.log('    Cancelado, sin cambios.')
    return 0
  }

  paso(4, 'Aplicando')
  for (const m of faltantes) await m.createCollection()
  // createIndexes y no syncIndexes: syncIndexes borra indices ajenos al schema
  for (const m of MODELOS) await m.createIndexes()
  console.log(`    ${faltantes.length} colecciones creadas, indices al dia. Listo.`)
  return 0
}

main()
  .then((code) => (process.exitCode = code))
  .catch((err: unknown) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => Usuario.db.close())
