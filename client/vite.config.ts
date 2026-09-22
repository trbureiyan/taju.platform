import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  // los SVG de marca viven en public/brand/ en la raiz del repo, no en client/public/ (no existe) -
  // sin esto, /brand/... da 404 tanto en dev como en el build de produccion
  publicDir: '../public',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
