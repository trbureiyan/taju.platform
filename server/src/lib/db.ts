import mongoose from 'mongoose'

let connected = false

/**
 * Conecta a la base de datos de MongoDB. Es idempotente (se puede llamar múltiples veces).
 * @throws Error si MONGO_URI no está definida.
 */
export async function connectDb(): Promise<void> {
  if (connected) return

  // MONGO_URI decide el ambiente destino (local, staging, prod) - sin ella preferimos tumbar el arranque
  const uri = process.env.MONGO_URI
  if (!uri) throw new Error('MONGO_URI no definida')

  await mongoose.connect(uri)
  connected = true
  console.log('MongoDB conectado')
}
