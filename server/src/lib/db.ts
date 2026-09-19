import mongoose from 'mongoose'

let connected = false

// idempotente: en dev con hot-reload esto se puede llamar varias veces
export async function connectDb(): Promise<void> {
  if (connected) return

  // MONGO_URI decide el ambiente destino (local, staging, prod) - sin ella preferimos tumbar el arranque
  const uri = process.env.MONGO_URI
  if (!uri) throw new Error('MONGO_URI no definida')

  await mongoose.connect(uri)
  connected = true
  console.log('MongoDB conectado')
}
