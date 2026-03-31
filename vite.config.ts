import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/genba-react/',
  plugins: [react()],
  server: {
    proxy: {
      '/river-api': {
        target: 'https://www.river.go.jp',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/river-api/, ''),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
