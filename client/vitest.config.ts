import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// config aparte de vite.config.ts: los tests no necesitan el plugin de Tailwind ni el proxy del dev server
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
})
