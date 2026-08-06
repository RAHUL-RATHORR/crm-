import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5011',
        changeOrigin: true,
      },
      '/ping': {
        target: 'http://localhost:5011',
        changeOrigin: true,
      },
    }
  }
})

