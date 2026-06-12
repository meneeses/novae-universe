import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  envPrefix: 'NOVAE_',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1100
  }
})
