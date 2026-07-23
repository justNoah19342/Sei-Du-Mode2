import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // maplibre-gl bundles its own web worker in a way Vite's dep pre-bundler
  // can't process; excluding it from optimizeDeps is the documented fix.
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
})
