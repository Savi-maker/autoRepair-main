import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/', // lub '/AutoRepair/' jeśli na GitHub Pages
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path // keep `/api` prefix so backend routes (mounted under `/api`) match
      }
    }
  }
})
