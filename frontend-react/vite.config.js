import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: { port: 5174 }, // otro puerto que el del frontend en Vue (5173), para poder tenerlos abiertos a la vez
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{js,jsx}'],
    setupFiles: ['tests/preparar-entorno.js']
  }
})
