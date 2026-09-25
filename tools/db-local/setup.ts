/**
 * Prepara la base MongoDB local para desarrollo: crea las colecciones y los
 * indices que declaran los modelos de server/src/models. Idempotente: lo que
 * ya existe se deja como esta, nunca borra ni modifica datos.
 *
 * Uso: pnpm db:local [--yes] [--uri <mongodb://...>]
 */
import { existsSync, readFileSync } from 'node:fs'
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
const COMANDOS_DOCKER = [
  'docker run -d --name taju-mongo -p 127.0.0.1:27017:27017 mongo:8 --replSet rs0',
  `docker exec taju-mongo mongosh --quiet --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'127.0.0.1:27017'}]})"`,
]

const args = process.argv.slice(2)
const sinPreguntar = args.includes('--yes') || args.includes('-y') || !process.stdin.isTTY

function paso(n: number, texto: string): void {
  console.log(`\n[${n}/4] ${texto}`)
}

function sugerirDocker(): void {
  console.error('    Levantalo como replica set de un nodo con:')
  for (const c of COMANDOS_DOCKER) console.error(`      ${c}`)
}

async function confirmar(pregunta: string): Promise<boolean> {
  if (sinPreguntar) return true
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const r = (await rl.question(`${pregunta} [s/N] `)).trim().toLowerCase()
  rl.close()
  return r === 's' || r === 'si' || r === 'y'
}

// [DECISION] Lectura manual de MONGO_URI y no process.loadEnvFile — loadEnvFile exige Node >=20.12 y engines declara >=20.0; dotenv es dependencia del server y no resuelve desde tools/. Solo se lee esa variable.
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
 * Destino en orden: --uri, MONGO_URI de la shell, MONGO_URI de server/.env, default local.
 * @throws Error si --uri viene sin valor; caer al default en silencio apuntaria a otra base.
 */
function resolverUri(): string {
  const i = args.indexOf('--uri')
  if (i !== -1) {
    const valor = args[i + 1]
    if (!valor || valor.startsWith('-')) throw new Error('--uri necesita una URI a continuacion, ej. --uri mongodb://127.0.0.1:27017/taju')
    return valor
  }
  // la shell gana sobre el .env, igual que dotenv en el server
  if (process.env.MONGO_URI) return process.env.MONGO_URI
  const envPath = resolve(__dirname, '../../server/.env')
  return (existsSync(envPath) ? leerMongoUriDeEnv(envPath) : undefined) ?? URI_POR_DEFECTO
}

// [!] guarda contra Atlas: este script es solo para local, un error de .env no debe tocar prod
function esLocal(uri: string): boolean {
  if (!uri.startsWith('mongodb://')) return false
  const autoridad = uri.slice('mongodb://'.length).split(/[/?]/)[0]
  // una URI de replica set lista varios hosts; el discovery puede alcanzar cualquiera, asi que todos deben ser locales
  const hosts = autoridad.slice(autoridad.lastIndexOf('@') + 1).split(',')
  return hosts.every((h) => HOSTS_LOCALES.includes(h.replace(/:\d+$/, '')))
}

// un mongod con --replSet sin rs.initiate() se reporta como RSGhost: no es seleccionable y la conexion vence por timeout
function esReplicaSinIniciar(err: unknown): boolean {
  const servers = (err as { reason?: { servers?: Map<string, { type?: string }> } }).reason?.servers
  return servers instanceof Map && [...servers.values()].some((s) => s.type === 'RSGhost')
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
    // sin autoCreate/autoIndex: conectar no debe escribir nada antes de que el plan se confirme en el paso 3
    await conn.openUri(uri, { serverSelectionTimeoutMS: 4000, autoCreate: false, autoIndex: false })
  } catch (err) {
    if (esReplicaSinIniciar(err)) {
      console.error('    MongoDB corre con --replSet pero el replica set no esta inicializado.')
      console.error(`    Inicializalo con: ${COMANDOS_DOCKER[1]}`)
    } else {
      console.error('    No hay MongoDB escuchando en ese destino.')
      sugerirDocker()
    }
    return 1
  }
  // [DECISION] Exigir replica set y no inicializarlo desde aqui — crearPedido usa transacciones y un standalone las rechaza; rs.initiate() desde el script depende del host:port que ve el contenedor y muta config del servidor, asi que queda como paso documentado.
  const hello = await conn.db!.admin().command({ hello: 1 })
  if (!hello.setName) {
    console.error('    MongoDB corre como standalone. Crear pedidos necesita transacciones, y solo un replica set las acepta.')
    sugerirDocker()
    return 1
  }
  console.log(`    OK, base "${conn.name}", replica set "${hello.setName}"`)

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
    console.error(err instanceof Error ? `    ${err.message}` : err)
    process.exitCode = 1
  })
  .finally(() => Usuario.db.close())
