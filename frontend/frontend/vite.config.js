import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Libraries that change far less often than the app: in their own
// files, a new deploy only invalidates the app chunks and returning
// users keep react/router/axios from their browser cache.
const VENDOR_CHUNKS = {
  'vendor-react': ['react', 'react-dom', 'react-router', 'react-router-dom', '@remix-run/router', 'scheduler'],
  'vendor-axios': ['axios'],
}

function vendorChunk(id) {
  if (!id.includes('node_modules')) return undefined
  const pkg = id.split('node_modules/').pop().split('/')
  const name = pkg[0].startsWith('@') ? `${pkg[0]}/${pkg[1]}` : pkg[0]
  for (const [chunk, pkgs] of Object.entries(VENDOR_CHUNKS)) {
    if (pkgs.includes(name)) return chunk
  }
  return undefined
}

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: vendorChunk,
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
