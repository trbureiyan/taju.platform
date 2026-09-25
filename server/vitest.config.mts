import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // secreto fijo solo para firmar tokens en tests - nunca se lee de .env aqui
    env: { JWT_SECRET: 'secreto-de-prueba-taju' },
    // la primera corrida descarga el binario de mongod, y levantar el replica set tarda unos segundos
    hookTimeout: 120_000,
    testTimeout: 30_000,
  },
})
