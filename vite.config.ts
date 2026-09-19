import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // The default 5s starts to get tight for userEvent-driven interaction
    // tests (Popconfirm confirmations etc.) once the suite runs many test
    // files in parallel workers — a real hang still fails loudly at 10s,
    // this just gives CPU-contention headroom room to breathe.
    testTimeout: 10_000,
  },
})
