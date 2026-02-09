/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      buffer: 'buffer/',
      events: 'events/',
      stream: 'stream-browserify',
    },
  },
  define: {
    'process.env': {},
    'globalThis.Buffer': 'globalThis.Buffer',
  },
  optimizeDeps: {
    include: ['buffer', 'events', 'stream-browserify'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
