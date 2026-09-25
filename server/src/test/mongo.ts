import mongoose from 'mongoose'
import { MongoMemoryReplSet } from 'mongodb-memory-server'

let replSet: MongoMemoryReplSet | null = null

/**
 * Levanta un mongod en memoria como replica set de un nodo y conecta mongoose.
 * Pensado para un beforeAll por archivo de test.
 */
export async function conectarMongoDePrueba(): Promise<void> {
  // replica set y no MongoMemoryServer suelto: un standalone rechaza transacciones, y crearPedido usa una
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } })
  await mongoose.connect(replSet.getUri())
  // los indices se construyen en segundo plano; sin esperar, el primer insert puede ganarle al indice unico
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()))
}

/** Vacía todas las colecciones sin tirar la conexión, para que cada test arranque limpio. */
export async function limpiarColecciones(): Promise<void> {
  const colecciones = await mongoose.connection.db!.collections()
  await Promise.all(colecciones.map((c) => c.deleteMany({})))
}

/** Cierra la conexión y apaga el replica set en memoria. */
export async function desconectarMongoDePrueba(): Promise<void> {
  await mongoose.disconnect()
  await replSet?.stop()
  replSet = null
}
